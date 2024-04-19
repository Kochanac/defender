#!/bin/sh


mkdir -p /etc/defender-worker/
cp config.yaml /etc/defender-worker/config.yaml

go build -o /sbin/defender-api cmd/api/main.go cmd/api/routes.go
go build -o /sbin/defender-worker cmd/worker/main.go
