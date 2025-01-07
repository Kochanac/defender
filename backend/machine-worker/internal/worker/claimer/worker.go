package claimer

import (
	"context"
	"errors"
	"fmt"
	"log"
	"log/slog"

	"machine-worker/internal/repository/work"
)

type Config struct {
	WorkBatchLimit int32
	WorkerID       string
}

type Worker struct {
	cfg *Config

	work work.Repository
}

func NewWorker(cfg *Config, work work.Repository) *Worker {
	return &Worker{
		cfg:  cfg,
		work: work,
	}
}

func chooseWorker(wrk work.Work, workers []work.Worker) (string, error) {
	weightSum := int64(0)
	for _, worker := range workers {
		weightSum += worker.Weight
	}

	point := int64(int64(wrk.WorkID) % weightSum)
	now := 0
	for _, worker := range workers {
		if now <= int(point) && point < int64(now)+worker.Weight {
			return worker.WorkerID, nil
		}
	}

	return "", errors.New("failed to choose a worker")
}

func (w Worker) Work(ctx context.Context) error {
	work, err := w.work.GetUnclaimedWork(ctx, w.cfg.WorkBatchLimit)
	if err != nil {
		return fmt.Errorf("get work: %w", err)
	}

	workers, err := w.work.GetWorkers(ctx)
	if err != nil {
		return fmt.Errorf("get workers: %w", err)
	}

	log.Printf("claiming work %+v", work)

	for _, wrk := range work {
		chosenWorker, err := chooseWorker(wrk, workers)
		if err != nil {
			slog.ErrorContext(ctx, "did not choose worker for work %d: %s", wrk.WorkID, err)
			continue
		}

		if chosenWorker != w.cfg.WorkerID {
			continue // do not claim others' work
		}

		err = w.work.ClaimWork(ctx, wrk.WorkID)
		if err != nil {
			slog.DebugContext(ctx, "did not claim work %d: %s", wrk.WorkID, err)
			log.Printf("did not claim work %d: %s", wrk.WorkID, err)
			continue
		}
	}

	return nil
}
