package main

import (
	"context"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"machine-worker/internal/config"
	"machine-worker/internal/provider/postgres"
	image_manager "machine-worker/internal/repository/image-manager"
	"machine-worker/internal/repository/machines"
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

	imageManager := image_manager.NewQCOW2Manager(cfg.GetImageManagerConfig())
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
