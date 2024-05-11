package objectstorage

import "context"

type Storage interface {
	DownloadTo(ctx context.Context, remotePath, localPath string) error
	UploadFrom(ctx context.Context, localPath, remotePath string) error
}
