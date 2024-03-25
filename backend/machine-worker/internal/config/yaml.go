package config

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/c-robinson/iplib"
	"github.com/knadh/koanf"
	"github.com/knadh/koanf/parsers/yaml"
	"github.com/knadh/koanf/providers/file"
	"machine-worker/internal/provider/postgres"
	machine_assignment "machine-worker/internal/repository/machine-assignment"
	"machine-worker/internal/repository/machines"
	"machine-worker/internal/repository/work"
	"machine-worker/internal/worker"
)

const CONFIG_PATH = "/etc/defender-worker/config.yaml"

const (
	ApiPrefix  = "api."
	ApiAddress = ApiPrefix + "address"

	WorkerPrefix           = "worker."
	WorkerID               = WorkerPrefix + "id"
	WorkerBatchLimit       = WorkerPrefix + "batch_limit"
	WorkerTimeout          = WorkerPrefix + "timeout"
	WorkerDelayBetweenRuns = WorkerPrefix + "delay_between_runs"

	PostgresPrefix      = "postgres."
	PostgresConnString  = PostgresPrefix + "conn_string"
	PostgresConnections = PostgresPrefix + "connections"

	MachinesPrefix            = "machines."
	MachinesDefaultCPU        = MachinesPrefix + "default_cpu"
	MachinesDefaultMemory     = MachinesPrefix + "default_memory_mb"
	MachinesSubnet            = MachinesPrefix + "subnet"
	MachinesRoutedNetworkName = MachinesPrefix + "routed_network_name"
	MachinesAddNetwork        = MachinesPrefix + "additional_network"

	ImagesPrefix   = "images."
	ImagesBasePath = ImagesPrefix + "base_path"
)

type Controller struct {
	k *koanf.Koanf
}

func InitConfig() (*Controller, error) {
	cfg := Controller{}
	cfg.k = koanf.New(".")

	f := file.Provider(CONFIG_PATH)
	err := cfg.loadConfig(f)
	if err != nil {
		return nil, fmt.Errorf("load config %w", err)
	}

	err = f.Watch(func(_ interface{}, err error) {
		log.Printf("loading new config")
		err = cfg.loadConfig(f)
		if err != nil {
			log.Printf("error: failed to load config: %s", err)
		}
	})
	if err != nil {
		return nil, fmt.Errorf("watch file changes: %w", err)
	}

	return &cfg, nil
}

func (c *Controller) setDefaults() error {
	defaults := map[string]interface{}{
		WorkerBatchLimit:          1,
		WorkerTimeout:             1 * time.Minute,
		WorkerDelayBetweenRuns:    10 * time.Second,
		MachinesDefaultCPU:        1,
		MachinesDefaultMemory:     1024,
		ImagesBasePath:            "/var/lib/libvirt/images",
		PostgresConnections:       1,
		MachinesRoutedNetworkName: "eth0",
		MachinesAddNetwork:        "default",
	}

	for key, val := range defaults {
		if !c.k.Exists(key) {
			err := c.k.Set(key, val)
			if err != nil {
				return fmt.Errorf("set default %s: %w", key, err)
			}
		}
	}

	return nil
}

func (c *Controller) loadConfig(provider koanf.Provider) error {
	err := c.k.Load(provider, yaml.Parser())
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}
	err = c.setDefaults()
	if err != nil {
		return fmt.Errorf("set defaults: %w", err)
	}
	return nil
}

func (c *Controller) GetImageManagerConfig() (basePath string) {
	return c.k.String(ImagesBasePath)
}

func (c *Controller) GetMachineAssignmentConfig() *machine_assignment.Config {
	return &machine_assignment.Config{
		WorkerID:       c.k.String(WorkerID),
		WorkerHostname: c.k.String(ApiAddress),
	}
}

func (c *Controller) GetMachinesConfig() *machines.Config {
	return &machines.Config{
		Subnet: func(_ context.Context) (string, uint8) {
			cidr, n, err := iplib.ParseCIDR(c.k.String(MachinesSubnet))
			if err != nil {
				log.Fatalf("could not parse machines subnet %s: %w", err)
				return "", 0
			}
			ones, _ := n.Mask().Size()
			return cidr.String(), uint8(ones)
		},
		RoutedNetworkName: func(_ context.Context) string {
			return c.k.String(MachinesRoutedNetworkName)
		},
		AddNetwork: func(_ context.Context) string {
			return c.k.String(MachinesAddNetwork)
		},
	}
}

func (c *Controller) GetWorkConfig() *work.Config {
	return &work.Config{
		WorkerID: c.k.String(WorkerID),
	}
}

func (c *Controller) GetWorkerConfig() *worker.Config {
	return &worker.Config{
		WorkBatchLimit:       int32(c.k.Int64(WorkerBatchLimit)),
		DefaultMachineMemory: uint64(c.k.Int64(MachinesDefaultMemory)),
		DefaultMachineVCPU:   uint64(c.k.Int64(MachinesDefaultCPU)),
	}
}

func (c *Controller) GetPostgres() *postgres.Config {
	return &postgres.Config{
		ConnString: c.k.String(PostgresConnString),
		ConnCount:  c.k.Int64(PostgresConnections),
	}
}

func (c *Controller) GetPeriodic() (timeout time.Duration, delay time.Duration) {
	return c.k.Duration(WorkerTimeout), c.k.Duration(WorkerDelayBetweenRuns)
}

func (c *Controller) GetHostname() string {
	return c.k.String(ApiAddress)
}
