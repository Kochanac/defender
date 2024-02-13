package main

import (
	"context"
	"log"

	image_manager "machine-worker/internal/repository/image-manager"
	"machine-worker/internal/repository/machines"
)

func main() {
	ctx := context.Background()

	cfg := &machines.Config{
		Subnet: func(ctx context.Context) (string, uint8) {
			return "10.222.10.0", 24
		},
	}

	imageManager := image_manager.NewQCOW2Manager("/var/lib/libvirt/images/")

	mash, err := machines.ConnectLibvirt(cfg, imageManager)
	if err != nil {
		log.Fatalf("failed to connect to libvirt: %s", err)
	}

	vm, err := mash.Create(ctx, machines.CreateModel{
		MemoryMB:      1000,
		VCPU:          1,
		BaseImagePath: "ssh.qcow2",
		TaskName:      "",
		VMID:          "test2",
	})
	if err != nil {
		log.Fatalf("failed to Create: %s", err)
	}

	log.Printf("Created a machine %s", vm)

	info, err := mash.GetInfo(ctx, vm)
	if err != nil {
		log.Fatalf("failed to GetInfo: %s", err)
	}
	log.Printf("Info about %s: %+v", vm, info)

	err = mash.Stop(ctx, vm)
	if err != nil {
		log.Fatalf("failed to stop vm %s: %s", vm, err)
	}

	err = mash.Stop(ctx, vm)
	if err != nil {
		log.Fatalf("failed to stop vm %s: %s", vm, err)
	}

	info, err = mash.GetInfo(ctx, vm)
	if err != nil {
		log.Printf("failed to GetInfo: %s", err)
	}
	log.Printf("2 Info about %s: %+v", vm, info)

	err = mash.Start(ctx, vm)
	if err != nil {
		log.Fatalf("failed to start vm %s: %s", vm, err)
	}

	info, err = mash.GetInfo(ctx, vm)
	if err != nil {
		log.Fatalf("failed to GetInfo: %s", err)
	}
	log.Printf("3 Info about %s: %+v", vm, info)

	err = mash.Remove(ctx, vm)
	if err != nil {
		log.Fatalf("failed to remove: %s", err)
	}
}
