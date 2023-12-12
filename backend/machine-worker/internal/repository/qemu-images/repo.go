package qemu_images

import (
	"context"
)

type Repository interface {
	EnsureImage(ctx context.Context, image string) (path string, err error)
}
