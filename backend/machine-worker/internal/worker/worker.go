package worker

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"log/slog"

	machine_assignment "machine-worker/internal/repository/machine-assignment"
	"machine-worker/internal/repository/machines"
	"machine-worker/internal/repository/work"
)

type Config struct {
	WorkBatchLimit int32

	DefaultMachineMemory uint64
	DefaultMachineVCPU   uint64
}

type Worker struct {
	cfg *Config

	mach              machines.Repository
	work              work.Repository
	machineAssignment machine_assignment.Repository
}

func NewWorker(cfg *Config, mach machines.Repository, work work.Repository, machineAssignment machine_assignment.Repository) *Worker {
	return &Worker{cfg: cfg, mach: mach, work: work, machineAssignment: machineAssignment}
}

func (w Worker) Work(ctx context.Context) error {
	workBatch, err := w.work.GetWork(ctx, w.cfg.WorkBatchLimit)
	if err != nil {
		return fmt.Errorf("get work: %w", err)
	}

	claimed := make([]work.Work, 0, len(workBatch))
	for _, wrk := range workBatch {
		err = w.work.ClaimWork(ctx, wrk.WorkID)
		if err != nil {
			slog.DebugContext(ctx, "did not claim work %d: %s", wrk.WorkID, err)
			log.Printf("did not claim work %d: %s", wrk.WorkID, err)
			continue
		}
		claimed = append(claimed, wrk)
	}

	log.Printf("claimed work %+v", claimed)

	for _, wrk := range claimed {
		res, err := w.handleWork(ctx, wrk)
		if err != nil && !errors.Is(err, machines.ErrorDomainNotFound) {
			return fmt.Errorf("handle work: %w", err)
		}
		if err != nil {
			res = ResultErr
		}

		err = w.work.SetResultOfDoneWork(ctx, wrk.WorkID, res)
		if err != nil {
			return fmt.Errorf("set result: %w", err)
		}
	}

	return nil
}

type CreateMachine struct {
	TaskName string `json:"task_name"`
	Image    string `json:"image"`
}

var (
	ResultOK  = "OK"
	ResultErr = "ERROR"
)

func (w Worker) handleWork(ctx context.Context, wrk work.Work) (result string, err error) {
	switch wrk.Type {
	case work.TypeCreateMachine:
		cm := CreateMachine{}
		err = json.Unmarshal([]byte(wrk.Data), &cm)
		if err != nil {
			return "", fmt.Errorf("failed to unmarshall: %w", err)
		}

		createMod := machines.CreateModel{
			MemoryMB:      w.cfg.DefaultMachineMemory,
			VCPU:          w.cfg.DefaultMachineVCPU,
			BaseImagePath: cm.Image,
			TaskName:      cm.TaskName,
			VMName:        wrk.MachineName,
		}
		name, err := w.mach.Create(ctx, createMod)
		if err != nil {
			return "", fmt.Errorf("create: %w", err)
		}
		if name != wrk.MachineName {
			slog.Error("created name != requested machine name")
		}

		err = w.machineAssignment.AssignMachine(ctx, name)
		if err != nil {
			removeErr := w.mach.Remove(ctx, name)
			if removeErr != nil {
				slog.Error("failed to remove a machine while failing to assign it to the worker: %w", err)
			}
			removeAssignmentErr := w.machineAssignment.RemoveMachine(ctx, name)
			if removeAssignmentErr != nil {
				slog.Error("failed to remove a machine while failing to assign it to the worker: %w", err)
			}
			return "", err
		}

		return ResultOK, nil
	case work.TypeStopMachine:
		err = w.mach.Stop(ctx, wrk.MachineName)
		if err != nil {
			return "", err
		}

		return ResultOK, nil
	case work.TypeStartMachine:
		err = w.mach.Start(ctx, wrk.MachineName)
		if err != nil {
			return "", err
		}

		return ResultOK, nil
	case work.TypeRemoveMachine:
		err = w.mach.Remove(ctx, wrk.MachineName)
		if err != nil {
			return "", err
		}

		err = w.machineAssignment.RemoveMachine(ctx, wrk.MachineName)
		if err != nil {
			return "", err
		}

		return ResultOK, nil
	case work.TypeUnknown:
		return "", fmt.Errorf("unknown work type")
	default:
		return "", fmt.Errorf("unknown work type")
	}
}
