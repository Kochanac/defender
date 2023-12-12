package machines

import (
	"context"
)

type Repository interface {
	Create(ctx context.Context) error
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
	Remove(ctx context.Context) error
}
