package s3

import (
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func NewS3(tokenID, tokenValue, endpoint string) (*minio.Client, error) {
	conn, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(tokenID, tokenValue, ""),
		Secure: true,
	})
	if err != nil {
		return nil, err
	}

	return conn, nil
}
