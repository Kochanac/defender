package work

import (
	"context"
)

type Repository interface {
	GetMachinesWork(ctx context.Context)
}
