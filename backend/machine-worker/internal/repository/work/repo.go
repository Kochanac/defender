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
)

type EventType int

const (
	EventTypeNull EventType = iota
	EventTypeAssigned
	EventTypeDone
)

type Work struct {
	WorkID     int32
	IsAssigned bool

	Type
	MachineName string
	Data        string
}

type Repository interface {
	GetWork(ctx context.Context, limit int32) ([]Work, error)
	ClaimWork(ctx context.Context, workID int32) error
	SetResultOfDoneWork(ctx context.Context, workID int32, result string) error
}
