package objectstorage

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"os"

	"github.com/minio/minio-go/v7"
)

var _ Storage = &s3{}

type Config struct {
	Bucket string
}

type s3 struct {
	cfg *Config

	conn *minio.Client
}

func New(cfg *Config, conn *minio.Client) *s3 {
	return &s3{
		cfg:  cfg,
		conn: conn,
	}
}

// DownloadTo implements Storage.
func (s *s3) DownloadTo(ctx context.Context, remotePath string, localPath string) error {
	obj, err := s.conn.GetObject(ctx, s.cfg.Bucket, remotePath, minio.GetObjectOptions{})
	if err != nil {
		return fmt.Errorf("s3 get object: %w", err)
	}
	defer obj.Close()

	file, err := os.OpenFile(localPath, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	w, err := io.Copy(file, obj)
	if err != nil {
		return fmt.Errorf("copy from s3: %w", err)
	}

	if w == 0 {
		slog.WarnContext(ctx, "written 0 bytes from s3. remotePath: %s, localPath: %s", remotePath, localPath)
	}

	return nil
}

// UploadFrom implements Storage.
func (s *s3) UploadFrom(ctx context.Context, localPath string, remotePath string) error {
	file, err := os.OpenFile(localPath, os.O_RDONLY, 0644)
	if err != nil {
		return fmt.Errorf("open file: %w", err)
	}
	defer file.Close()

	_, err = s.conn.PutObject(ctx, s.cfg.Bucket, remotePath, file, -1, minio.PutObjectOptions{})
	if err != nil {
		return fmt.Errorf("s3 put object: %w", err)
	}

	return nil
}
