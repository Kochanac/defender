package image_manager

import (
	"context"
)

type Repository interface {
	EnsureImage(ctx context.Context, image string) (path string, err error)
	UploadImage(ctx context.Context, image string) (err error)

	MakeChildImage(ctx context.Context, baseImagePath string) (newImagePath string, err error)
	RemoveImage(ctx context.Context, imagePath string) (err error)
}
