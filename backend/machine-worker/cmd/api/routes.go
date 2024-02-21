package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"machine-worker/internal/repository/machines"
)

type Server struct {
	mach machines.Repository
}

func NewServer(mach machines.Repository) *Server {
	return &Server{mach: mach}
}

type VmInfoRequest struct {
	VMName string `json:"vm_name"`
}

func (s *Server) VMInfo(c *gin.Context) {
	var req VmInfoRequest
	err := c.BindJSON(&req)
	if err != nil {
		err = fmt.Errorf("failed to bind request to json: %w", err)
		c.JSON(500, gin.H{
			"error": err.Error(),
		})
		return
	}

	info, err := s.mach.GetInfo(c.Request.Context(), req.VMName)
	if err != nil {
		err = fmt.Errorf("failed to get info about a machine: %w", err)
		c.JSON(500, gin.H{
			"error": err.Error(),
		})
	}

	c.JSON(200, gin.H{
		"ip":         info.IP,
		"task_name":  info.TaskName,
		"is_running": info.IsRunning,
	})
}
