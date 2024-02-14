package machines

import (
	"context"
)

type CreateModel struct {
	MemoryMB uint64
	VCPU     uint64

	BaseImagePath string

	TaskName string
	VMName   string
}

type Info struct {
	TaskName  string
	IP        string
	IsRunning bool
}

type Repository interface {
	Create(ctx context.Context, mod CreateModel) (id string, err error)
	Start(ctx context.Context, name string) error
	GetInfo(ctx context.Context, name string) (Info, error)
	Stop(ctx context.Context, name string) error
	Remove(ctx context.Context, name string) error
}
