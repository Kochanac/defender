package machines

import (
	"fmt"
	"net"
	"time"
)

type dialer struct {
}

func (d dialer) Dial() (net.Conn, error) {
	c, err := net.DialTimeout("unix", "/var/run/libvirt/libvirt-sock", 2*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to dial libvirt: %w", err)
	}
	return c, nil
}
