package machine_assignment

import (
	"context"
)

type Repository interface {
	AssignMachine(ctx context.Context, machineName string) error
	RemoveMachine(ctx context.Context, machineName string) error
}
