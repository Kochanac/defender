package main

import (
	"context"
	"fmt"
	"log"

	"machine-worker/internal/config"
	"machine-worker/internal/provider/postgres"
	"machine-worker/internal/provider/s3"
	image_manager "machine-worker/internal/repository/image-manager"
	"machine-worker/internal/repository/machines"
	objectstorage "machine-worker/internal/storage/object-storage"

	"github.com/gin-gonic/gin"
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

	imageManager := image_manager.NewQCOW2Manager(cfg.GetImageManagerConfig(), storage)
	mash, err := machines.ConnectLibvirt(cfg.GetMachinesConfig(), imageManager)
	if err != nil {
		log.Fatalf("failed to init machine-repo: %s", err)
	}
	defer mash.Close()

	server := NewServer(mash)

	router := gin.Default()
	router.GET("/vm-info", server.VMInfo)

	err = router.Run(fmt.Sprintf("%s:20768", cfg.GetHostname()))
	if err != nil {
		log.Fatalf("failed to start server: %s", err)
	}
}
