package image_manager

import (
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path"

	objectstorage "machine-worker/internal/storage/object-storage"
	"machine-worker/internal/util"
)

var _ Repository = &QCOW2Manager{}

type QCOW2Manager struct {
	basePath string

	objStore objectstorage.Storage
}

func NewQCOW2Manager(basePath string, objStore objectstorage.Storage) *QCOW2Manager {
	return &QCOW2Manager{
		basePath: basePath,
		objStore: objStore,
	}
}

func (Q *QCOW2Manager) EnsureImage(ctx context.Context, imagePath string) (path string, err error) {
	_, err = os.Stat(imagePath)
	if !os.IsNotExist(err) {
		return imagePath, nil
	}

	err = Q.objStore.DownloadTo(ctx, imagePath, imagePath)
	if err != nil {
		return "", fmt.Errorf("obj store download: %w", err)
	}

	return imagePath, nil
}

// UploadImage implements Repository.
func (Q *QCOW2Manager) UploadImage(ctx context.Context, image string) (err error) {
	err = Q.objStore.UploadFrom(ctx, image, image)
	if err != nil {
		return fmt.Errorf("obj store upload: %w", err)
	}

	return nil
}

// UploadImage implements Repository.
func (Q *QCOW2Manager) CopyImage(ctx context.Context, image string, newName string) (err error) {
	from, err := os.OpenFile(image, os.O_RDONLY, 0644)
	if err != nil {
		return fmt.Errorf("open file to read from: %w", err)
	}
	defer from.Close()

	to, err := os.OpenFile(newName, os.O_WRONLY|os.O_CREATE, 0644)
	if err != nil {
		return fmt.Errorf("open file to write to: %w", err)
	}
	defer to.Close()

	_, err = io.Copy(to, from)
	if err != nil {
		return fmt.Errorf("copy image: %w", err)
	}

	return nil
}

func generateChildrenPathName(baseImagePath string) string {
	return path.Base(baseImagePath) + "-" + util.Hash(baseImagePath)[:4]
}

func (Q *QCOW2Manager) MakeChildImage(ctx context.Context, baseImagePath string) (newImagePath string, err error) {
	// todo use ctx
	if !path.IsAbs(baseImagePath) {
		baseImagePath = path.Join(Q.basePath, baseImagePath)
	}

	childrenFolder := path.Join(path.Dir(baseImagePath), generateChildrenPathName(baseImagePath))

	_, err = os.Stat(childrenFolder)
	if os.IsNotExist(err) {
		err = os.Mkdir(childrenFolder, os.ModePerm)
		if err != nil {
			return "", fmt.Errorf("create childrenFolder %s: %w", childrenFolder, err)
		}
	}
	if err != nil {
		return "", fmt.Errorf("os stat childrenFolder %s: %w", childrenFolder, err)
	}

	newImagePath = path.Join(childrenFolder, util.RandomHash(8)) + ".qcow2"
	cmd := exec.Command("qemu-img", "create", "-f", "qcow2", "-F", "qcow2", "-b", baseImagePath, newImagePath)
	err = cmd.Run()
	if err != nil {
		return "", fmt.Errorf("running qemu-img create -f qcow2 -F qcow2 -b %s %s: %w", baseImagePath, newImagePath, err)
	}

	return newImagePath, nil
}

func (Q *QCOW2Manager) RemoveImage(ctx context.Context, imagePath string) (err error) {
	if !path.IsAbs(imagePath) {
		imagePath = path.Join(Q.basePath, imagePath)
	}

	err = os.Remove(imagePath)
	if err != nil {
		return fmt.Errorf("os remove: %s", err)
	}

	return nil
}
