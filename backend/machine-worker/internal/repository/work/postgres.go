package work

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	WorkerID string
}

type Postgres struct {
	pg  *pgxpool.Pool
	cfg *Config
}

func NewPostgres(pg *pgxpool.Pool, cfg *Config) *Postgres {
	return &Postgres{pg: pg, cfg: cfg}
}

func convertWorkType(t string) Type {
	switch t {
	case "create":
		return TypeCreateMachine
	case "stop":
		return TypeStopMachine
	case "start":
		return TypeStartMachine
	case "remove":
		return TypeRemoveMachine
	case "upload-image":
		return TypeUploadImage
	default:
		return TypeUnknown
	}
}

func convertWorkEventType(t string) EventType {
	switch t {
	case "ASSIGNED":
		return EventTypeAssigned
	case "DONE":
		return EventTypeDone
	default:
		return EventTypeNull
	}
}

func scanWork(rows pgx.Rows, limit int32) ([]Work, error) {
	wrk := make([]Work, 0, limit)
	for rows.Next() {
		var w Work
		var t string
		var workerID, machineName, data pgtype.Text
		err := rows.Scan(&w.WorkID, &t, &workerID, &machineName, &data)
		if err != nil {
			return nil, fmt.Errorf("rows scan: %w", err)
		}

		w.Type = convertWorkType(t)
		w.MachineName = machineName.String
		w.Data = data.String

		wrk = append(wrk, w)
	}

	return wrk, nil
}

func (p *Postgres) GetUnclaimedWork(ctx context.Context, limit int32) ([]Work, error) {
	request := `
		SELECT work.id, type, work.worker_id, machine_id, data 
		FROM work
		INNER JOIN workers ON workers.worker_id = $1

		WHERE 
			work.worker_id IS NULL
		ORDER BY work.id ASC 
		LIMIT $2 
	`

	rows, err := p.pg.Query(ctx, request, p.cfg.WorkerID, limit)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	wrk, err := scanWork(rows, limit)
	if err != nil {
		return nil, err
	}

	return wrk, nil
}

func (p *Postgres) GetWorkers(ctx context.Context) ([]Worker, error) {
	request := `
		SELECT id, worker_id, weight
		FROM workers
	`

	rows, err := p.pg.Query(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	wrk := make([]Worker, 0)
	for rows.Next() {
		var w Worker
		err := rows.Scan(&w.ID, &w.WorkerID, &w.Weight)
		if err != nil {
			return nil, fmt.Errorf("rows scan: %w", err)
		}

		wrk = append(wrk, w)
	}

	return wrk, nil
}

func (p *Postgres) ClaimWork(ctx context.Context, workID int32) error {
	tx, err := p.pg.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			log.Printf("rollback err: %s", err)
		}
	}()

	row := tx.QueryRow(ctx, "SELECT worker_id, event_type FROM work_events WHERE work_id=$1", workID)

	var workerID, eventType string
	err = row.Scan(&workerID, &eventType)
	notFound := errors.Is(err, pgx.ErrNoRows)
	if err != nil && !notFound {
		return fmt.Errorf("query existing value: %w", err)
	}
	if !notFound && workerID == p.cfg.WorkerID {
		if convertWorkEventType(eventType) == EventTypeAssigned {
			return nil
		} else {
			return fmt.Errorf("already another work-event-type: %s", eventType)
		}
	}

	_, err = tx.Exec(ctx, "INSERT INTO work_events (work_id, worker_id, event_type) VALUES ($1, $2, 'ASSIGNED')", workID, p.cfg.WorkerID)
	if err != nil {
		return fmt.Errorf("tx exec update work-events: %w", err)
	}

	_, err = tx.Exec(ctx, "UPDATE work SET worker_id=$1 WHERE id=$2", p.cfg.WorkerID, workID)
	if err != nil {
		return fmt.Errorf("tx exec update work: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return fmt.Errorf("tx commit: %w", err)
	}

	return nil
}

func (p *Postgres) GetClaimedWork(ctx context.Context, limit int32) ([]Work, error) {
	request := `
		SELECT id, type, worker_id, machine_id, data 
		FROM work
		WHERE
			worker_id = $1 AND result is NULL
		ORDER BY id ASC
		LIMIT $2
	`

	rows, err := p.pg.Query(ctx, request, p.cfg.WorkerID, limit)
	if err != nil {
		return nil, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	wrk, err := scanWork(rows, limit)
	if err != nil {
		return nil, err
	}

	return wrk, nil
}

func (p *Postgres) SetResultOfDoneWork(ctx context.Context, workID int32, result string) error {
	tx, err := p.pg.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		err = tx.Rollback(ctx)
		if err != nil && !errors.Is(err, pgx.ErrTxClosed) {
			log.Printf("rollback err: %s", err)
		}
	}()

	_, err = tx.Exec(ctx, "INSERT INTO work_events (work_id, worker_id, event_type) VALUES ($1, $2, 'DONE')", workID, p.cfg.WorkerID)
	if err != nil {
		return fmt.Errorf("insert work-events: %w", err)
	}

	_, err = tx.Exec(ctx, "UPDATE work SET result=$1 WHERE id=$2", result, workID)
	if err != nil {
		return fmt.Errorf("pg update: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	return nil
}
