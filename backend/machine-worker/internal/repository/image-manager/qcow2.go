package image_manager

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path"

	"machine-worker/internal/util"
)

type QCOW2Manager struct {
	basePath string
}

func NewQCOW2Manager(basePath string) *QCOW2Manager {
	return &QCOW2Manager{basePath: basePath}
}

func (Q *QCOW2Manager) EnsureImage(ctx context.Context, image string) (path string, err error) {
	return image, nil
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
		return "", fmt.Errorf("running qemu-img create -f qcow2 -b %s %s: %w", baseImagePath, newImagePath, err)
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
