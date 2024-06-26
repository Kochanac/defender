package machine_assignment

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var _ Repository = &Postgres{}

type Config struct {
	WorkerID       string
	WorkerHostname string
}

type Postgres struct {
	pg  *pgxpool.Pool
	cfg *Config
}

func NewPostgres(pg *pgxpool.Pool, cfg *Config) *Postgres {
	return &Postgres{pg: pg, cfg: cfg}
}

func (p *Postgres) AssignMachine(ctx context.Context, machineName string, meta Metadata) error {
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

	row := tx.QueryRow(ctx, "SELECT worker_id, machine_id FROM machine_assignment WHERE machine_id=$1", machineName)
	var workerID, machineID string
	err = row.Scan(&workerID, &machineID)
	notFound := errors.Is(err, pgx.ErrNoRows)
	if err != nil && !notFound {
		return fmt.Errorf("query existing value: %w", err)
	}

	if !notFound && workerID != p.cfg.WorkerID {
		return fmt.Errorf("worker of this machine does not match the real worker. %s != %s", workerID, p.cfg.WorkerID)
	}

	if !notFound {
		return nil
	}

	_, err = tx.Exec(ctx, "INSERT INTO machine_assignment (worker_id, machine_id, worker_hostname, image_path) VALUES ($1, $2, $3, $4)", p.cfg.WorkerID, machineName, p.cfg.WorkerHostname, meta.ImagePath)
	if err != nil {
		return fmt.Errorf("insert machine_assignment: %w", err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		return fmt.Errorf("tx commit: %w", err)
	}

	return nil
}

func (p *Postgres) RemoveMachine(ctx context.Context, machineName string) error {
	_, err := p.pg.Exec(ctx, "DELETE FROM machine_assignment WHERE machine_id=$1", machineName)
	if err != nil {
		return fmt.Errorf("delete from machine_assignment: %w", err)
	}

	return nil
}

// GetMeta implements Repository.
func (p *Postgres) GetMeta(ctx context.Context, machineName string) (meta Metadata, err error) {
	row := p.pg.QueryRow(ctx, "SELECT worker_id, image_path FROM machine_assignment WHERE machine_id=$1", machineName)
	var workerID, imagePath string
	err = row.Scan(&workerID, &imagePath)
	notFound := errors.Is(err, pgx.ErrNoRows)
	if err != nil {
		return Metadata{}, fmt.Errorf("query existing value: %w", err)
	}
	if notFound {
		return Metadata{}, errors.New("not found")
	}

	if !notFound && workerID != p.cfg.WorkerID {
		return Metadata{}, fmt.Errorf("worker of this machine does not match the real worker. %s != %s", workerID, p.cfg.WorkerID)
	}

	return Metadata{
		ImagePath: imagePath,
	}, nil
}
