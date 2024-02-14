package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.uber.org/atomic"
	"machine-worker/internal/config"
	"machine-worker/internal/provider/postgres"
	image_manager "machine-worker/internal/repository/image-manager"
	machine_assignment "machine-worker/internal/repository/machine-assignment"
	"machine-worker/internal/repository/machines"
	"machine-worker/internal/repository/work"
	"machine-worker/internal/util/periodic"
	"machine-worker/internal/worker"
)

func main() {
	ctx := context.Background()

	cfg, err := config.InitConfig()
	if err != nil {
		log.Fatalf("config init failed: %s", err)
	}

	pg, err := postgres.MakePostgres(ctx, cfg.GetPostgres())
	if err != nil {
		log.Fatalf("postgres init failed: %s", err)
	}
	defer pg.Close()

	workRepo := work.NewPostgres(pg, cfg.GetWorkConfig())
	imageManager := image_manager.NewQCOW2Manager(cfg.GetImageManagerConfig())
	machineAssignment := machine_assignment.NewPostgres(pg, cfg.GetMachineAssignmentConfig())
	mash, err := machines.ConnectLibvirt(cfg.GetMachinesConfig(), imageManager)
	if err != nil {
		log.Fatalf("failed to init machine-repo: %s", err)
	}
	defer mash.Close()

	wrkr := worker.NewWorker(cfg.GetWorkerConfig(), mash, workRepo, machineAssignment)

	timeout, delay := cfg.GetPeriodic()
	aTimeout := &atomic.Duration{}
	aTimeout.Store(timeout) // todo live config
	periodicWorker := periodic.NewWorker(wrkr.Work, time.NewTicker(delay), aTimeout)
	defer periodicWorker.Close()

	go func() {
		periodicWorker.Run()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	signal.Notify(quit, os.Kill)
	signal.Notify(quit, syscall.SIGHUP)
	<-quit
	log.Printf("exiting...")
}
