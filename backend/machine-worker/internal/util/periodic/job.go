package periodic

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"go.uber.org/atomic"
)

type Worker struct {
	job       func(ctx context.Context) error
	isRunning chan struct{}

	ticker  *time.Ticker
	timeout *atomic.Duration
	mutex   *sync.Mutex
}

func NewWorker(job func(ctx context.Context) error, timer *time.Ticker, timeout *atomic.Duration) *Worker {
	isRunning := make(chan struct{})
	return &Worker{job: job, ticker: timer, isRunning: isRunning, timeout: timeout, mutex: &sync.Mutex{}}
}

func (w *Worker) Close() {
	w.ticker.Stop()
	close(w.isRunning)
}

func (w *Worker) Run() {
	for {
		select {
		case <-w.ticker.C:
			w.mutex.Lock()
			ctx, cancel := context.WithTimeout(context.Background(), w.timeout.Load())
			err := w.job(ctx)
			if err != nil {
				slog.ErrorContext(ctx, "worker: error in a job: %s", err)
			}
			cancel()
			w.mutex.Unlock()
		case <-w.isRunning:
			return
		}
	}
}
