package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"machine-worker/internal/config"
	"machine-worker/internal/provider/postgres"
	"machine-worker/internal/provider/s3"
	image_manager "machine-worker/internal/repository/image-manager"
	machine_assignment "machine-worker/internal/repository/machine-assignment"
	"machine-worker/internal/repository/machines"
	"machine-worker/internal/repository/work"
	objectstorage "machine-worker/internal/storage/object-storage"
	"machine-worker/internal/util/periodic"
	"machine-worker/internal/worker/claimer"
	"machine-worker/internal/worker/handler"

	"go.uber.org/atomic"
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

	token, secret, endpoint := cfg.GetS3ConnectInfo()
	s3Conn, err := s3.NewS3(token, secret, endpoint)
	if err != nil {
		log.Fatalf("failed to connect to S3: %s", err)
	}
	storage := objectstorage.New(cfg.GetS3StorageConfig(), s3Conn)

	workRepo := work.NewPostgres(pg, cfg.GetWorkConfig())
	imageManager := image_manager.NewQCOW2Manager(cfg.GetImageManagerConfig(), storage)
	machineAssignment := machine_assignment.NewPostgres(pg, cfg.GetMachineAssignmentConfig())
	mash, err := machines.ConnectLibvirt(cfg.GetMachinesConfig(), imageManager)
	if err != nil {
		log.Fatalf("failed to init machine-repo: %s", err)
	}
	defer mash.Close()

	uploader := handler.NewWorker(cfg.GetHandlerConfig(), mash, workRepo, machineAssignment, imageManager, []work.Type{
		work.TypeUploadImage,
	})
	machineHandler := handler.NewWorker(cfg.GetHandlerConfig(), mash, workRepo, machineAssignment, imageManager, []work.Type{
		work.TypeCreateMachine,
		work.TypeStopMachine,
		work.TypeStartMachine,
		work.TypeRemoveMachine,
	})
	claimer := claimer.NewWorker(cfg.GetClaimerConfig(), workRepo)

	timeout, delay := cfg.GetPeriodic()
	aTimeout := &atomic.Duration{}
	aTimeout.Store(timeout) // todo live config
	// todo different timeout but probably not

	periodicUploader := periodic.NewWorker(uploader.Work, time.NewTicker(delay), aTimeout)
	defer periodicUploader.Close()
	periodicHandler := periodic.NewWorker(machineHandler.Work, time.NewTicker(delay), aTimeout)
	defer periodicHandler.Close()

	periodicClaimer := periodic.NewWorker(claimer.Work, time.NewTicker(delay), aTimeout)
	defer periodicClaimer.Close()

	go func() {
		periodicUploader.Run()
	}()
	go func() {
		periodicHandler.Run()
	}()
	go func() {
		periodicClaimer.Run()
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	signal.Notify(quit, os.Kill)
	signal.Notify(quit, syscall.SIGHUP)
	<-quit
	log.Printf("exiting...")
}
