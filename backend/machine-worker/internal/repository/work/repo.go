package work

import (
	"context"
)

type Type int

const (
	TypeUnknown Type = iota
	TypeCreateMachine
	TypeStopMachine
	TypeStartMachine
	TypeRemoveMachine
	TypeUploadImage
)

type EventType int

const (
	EventTypeNull EventType = iota
	EventTypeAssigned
	EventTypeDone
)

type Work struct {
	WorkID int32

	Type
	MachineName string
	Data        string
}

type Worker struct {
	ID       int64
	WorkerID string
	Weight   int64
}

type Repository interface {
	GetUnclaimedWork(ctx context.Context, limit int32) ([]Work, error)
	GetWorkers(ctx context.Context) ([]Worker, error)
	ClaimWork(ctx context.Context, workID int32) error

	GetClaimedWork(ctx context.Context, limit int32) ([]Work, error)
	SetResultOfDoneWork(ctx context.Context, workID int32, result string) error
}
