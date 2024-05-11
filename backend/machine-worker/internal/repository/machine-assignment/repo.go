package machine_assignment

import (
	"context"
)

type Metadata struct {
	ImagePath string
}

type Repository interface {
	AssignMachine(ctx context.Context, machineName string, meta Metadata) error
	GetMeta(ctx context.Context, machineName string) (meta Metadata, err error)
	RemoveMachine(ctx context.Context, machineName string) error
}
