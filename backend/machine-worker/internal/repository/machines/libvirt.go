package machines

import (
	"context"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net"
	"strings"

	image_manager "machine-worker/internal/repository/image-manager"

	"github.com/c-robinson/iplib"
	"libvirt.org/go/libvirt"
	"libvirt.org/go/libvirtxml"
)

type Config struct {
	Subnet            func(ctx context.Context) (string, uint8) // (10.2.N.0, 24) – N is important
	RoutedNetworkName func(ctx context.Context) string
	AddNetwork        func(ctx context.Context) string
}

type Libvirt struct {
	conn         *libvirt.Connect
	imageManager image_manager.Repository
	c            *Config
}

func (l *Libvirt) Close() error {
	if _, err := l.conn.Close(); err != nil {
		return fmt.Errorf("failed to disconnect: %w", err)
	}

	return nil
}

func ConnectLibvirt(c *Config, repository image_manager.Repository) (*Libvirt, error) {
	conn, err := libvirt.NewConnect("qemu:///system")
	if err != nil {
		return nil, fmt.Errorf("libvirt connect: %w", err)
	}

	domains, err := conn.ListAllDomains(libvirt.CONNECT_LIST_DOMAINS_ACTIVE)
	if err != nil {
		return nil, err
	}

	for _, domain := range domains {
		log.Printf("domain: %+v", domain)
	}

	return &Libvirt{conn: conn, c: c, imageManager: repository}, nil
}

func isNotFound(err error) bool {
	return strings.Contains(err.Error(), "Domain not found: no domain with matching name")
}

func (l *Libvirt) createVM(ctx context.Context, mod CreateModel, networkName, imageName string) (string, error) {
	zp := uint(0)

	dom := &libvirtxml.Domain{
		Type: "kvm",
		Name: mod.VMName,

		Memory: &libvirtxml.DomainMemory{
			Value: uint(mod.MemoryMB),
			Unit:  "MB",
		},
		VCPU: &libvirtxml.DomainVCPU{
			Value: 1,
		},
		OS: &libvirtxml.DomainOS{
			Type: &libvirtxml.DomainOSType{
				Arch:    "x86_64",
				Machine: "pc",
				Type:    "hvm",
			},
		},
		Clock: &libvirtxml.DomainClock{
			Offset: "localtime",
		},
		Devices: &libvirtxml.DomainDeviceList{
			Emulator: "/usr/bin/qemu-system-x86_64",
			Disks: []libvirtxml.DomainDisk{
				{
					Device: "disk",
					Source: &libvirtxml.DomainDiskSource{
						File: &libvirtxml.DomainDiskSourceFile{
							File: imageName,
						},
					},
					Target: &libvirtxml.DomainDiskTarget{
						Dev: "hda",
					},
					Driver: &libvirtxml.DomainDiskDriver{
						Type: "qcow2",
						Name: "qemu",
					},
				},
			},
			Interfaces: []libvirtxml.DomainInterface{
				{
					Source: &libvirtxml.DomainInterfaceSource{
						Network: &libvirtxml.DomainInterfaceSourceNetwork{Network: l.c.AddNetwork(ctx)},
					},
					Target: &libvirtxml.DomainInterfaceTarget{
						Dev: "eth0",
					},
				},
				{
					Source: &libvirtxml.DomainInterfaceSource{
						Network: &libvirtxml.DomainInterfaceSourceNetwork{Network: networkName},
					},
					Target: &libvirtxml.DomainInterfaceTarget{
						Dev: "eth10",
					},
				},
			},
			Serials: []libvirtxml.DomainSerial{
				{
					Source: &libvirtxml.DomainChardevSource{
						Pty: &libvirtxml.DomainChardevSourcePty{Path: "/dev/pts/0"},
					},
					Target: &libvirtxml.DomainSerialTarget{
						Port: &zp,
					},
				},
			},
			Consoles: []libvirtxml.DomainConsole{
				{
					Target: &libvirtxml.DomainConsoleTarget{Type: "serial", Port: &zp},
					TTY:    "0",
				},
			},
		},
		Metadata: &libvirtxml.DomainMetadata{XML: mod.TaskName},
	}

	xml, err := dom.Marshal()
	if err != nil {
		return "", fmt.Errorf("dom marshal error: %w", err)
	}

	//fmt.Println(xml)

	rDom, err := l.conn.DomainDefineXML(xml) // todo CONTEXT
	if err != nil {
		if strings.Contains(err.Error(), fmt.Sprintf("domain '%s' already exists with uuid", dom.Name)) {
			return dom.Name, nil // already created
		}
		return "", err
	}
	log.Printf("Defined domain %+v", rDom)

	name, err := rDom.GetName()
	if err != nil {
		return "", fmt.Errorf("get name string: %w", err)
	}

	return name, nil
}

func (l *Libvirt) createNetwork(ctx context.Context, mod CreateModel) (string, error) {
	ip, subnet := l.c.Subnet(ctx)

	log.Printf("ip %v subnet %v", ip, subnet)

	n4 := iplib.NewNet4(net.ParseIP(ip), int(subnet))

	var err error
	for addr := n4.FirstAddress(); !errors.Is(err, iplib.ErrAddressOutOfRange); addr, err = n4.NextIP(addr) {
		maskSize := 30
		machineNet := iplib.NewNet4(addr, maskSize)

		networkDOM := libvirtxml.Network{
			Name: mod.VMName,
			Forward: &libvirtxml.NetworkForward{
				Mode: "route",
				Dev:  l.c.RoutedNetworkName(ctx),
			},
			IPs: []libvirtxml.NetworkIP{
				{
					Address: addr.String(),
					Prefix:  uint(maskSize),
					DHCP: &libvirtxml.NetworkDHCP{
						Ranges: []libvirtxml.NetworkDHCPRange{ // может поменять на статический.. наверное похуй
							{
								Start: machineNet.FirstAddress().String(),
								End:   machineNet.LastAddress().String(),
							},
						},
					},
				},
			},
		}

		networkXML, err := networkDOM.Marshal()
		if err != nil {
			return "", fmt.Errorf("marshal network domain XML: %w", err)
		}

		//fmt.Println(networkXML)

		net, err := l.conn.NetworkCreateXML(networkXML)
		if err != nil {
			if strings.Contains(err.Error(), "Network is already in use") {
				continue
			}
			if strings.Contains(err.Error(), fmt.Sprintf("network '%s' already exists with uuid", networkDOM.Name)) {
				return networkDOM.Name, nil // already made
			}
			return "", fmt.Errorf("create network domain: %w", err)
		}

		netUUID, err := net.GetName()
		if err != nil {
			return "", fmt.Errorf("network getUUID string: %w", err)
		}

		return netUUID, nil
	}

	return "", fmt.Errorf("not found a viable network")
}

func (l *Libvirt) Create(ctx context.Context, mod CreateModel) (id string, err error) {
	image, err := l.imageManager.MakeChildImage(ctx, mod.BaseImagePath)
	if err != nil {
		return "", fmt.Errorf("creating child image: %w", err)
	}

	net, err := l.createNetwork(ctx, mod)
	if err != nil {
		return "", err
	}

	vmName, err := l.createVM(ctx, mod, net, image)
	if err != nil {
		return "", err
	}

	err = l.Start(ctx, vmName)
	if err != nil {
		removeErr := l.Remove(ctx, vmName)
		if err != nil {
			slog.ErrorContext(ctx, "failed to remove after failing to start a domain: %s", removeErr)
		}
		return "", err
	}

	return vmName, nil
}

func (l *Libvirt) Start(ctx context.Context, name string) error {
	dom, err := l.conn.LookupDomainByName(name)
	if err != nil {
		if isNotFound(err) {
			return fmt.Errorf("%w, lookup by name: %s", ErrorDomainNotFound, err)
		}
		return fmt.Errorf("lookup by name: %w", err)
	}

	err = dom.Create()
	if err != nil {
		if strings.Contains(err.Error(), "domain is already running") {
			return nil
		}
		return fmt.Errorf("create: %w", err)
	}

	return nil
}

func (l *Libvirt) GetInfo(ctx context.Context, name string) (Info, error) {
	dom, err := l.conn.LookupDomainByName(name)
	if err != nil {
		if isNotFound(err) {
			return Info{}, fmt.Errorf("%w, lookup by name: %s", ErrorDomainNotFound, err)
		}
		return Info{}, fmt.Errorf("lookup by name: %w", err)
	}

	info, err := dom.GetInfo()
	if err != nil {
		return Info{}, fmt.Errorf("get info: %w", err)
	}

	if info.State != libvirt.DOMAIN_RUNNING {
		return Info{
			IP:        "",
			IsRunning: false,
		}, nil
	}

	ifs, err := dom.ListAllInterfaceAddresses(libvirt.DOMAIN_INTERFACE_ADDRESSES_SRC_LEASE)
	if err != nil {
		return Info{}, fmt.Errorf("get if addresses: %w", err)
	}
	if len(ifs) == 0 {
		return Info{}, fmt.Errorf("no network interfaces")
	}

	ip, subnet := l.c.Subnet(ctx)
	n4 := iplib.NewNet4(net.ParseIP(ip), int(subnet))

	var resIP string
	for _, iface := range ifs {
		addrs := iface.Addrs
		for _, addr := range addrs {
			ip := net.ParseIP(addr.Addr)
			if n4.Contains(ip) {
				resIP = addr.Addr
			}
		}
	}
	if resIP == "" {
		return Info{}, fmt.Errorf("no matching IPs")
	}

	desc, err := dom.GetXMLDesc(libvirt.DOMAIN_XML_MIGRATABLE)
	if err != nil {
		return Info{}, fmt.Errorf("get xml desc: %w", err)
	}
	domCfg := &libvirtxml.Domain{}
	err = domCfg.Unmarshal(desc)
	if err != nil {
		return Info{}, fmt.Errorf("unmarshal: %w", err)
	}

	if domCfg.Metadata == nil {
		return Info{}, fmt.Errorf("no metadata in XML desc")
	}

	return Info{
		TaskName:  domCfg.Metadata.XML,
		IP:        resIP,
		IsRunning: info.State == libvirt.DOMAIN_RUNNING,
	}, nil
}

func (l *Libvirt) Stop(ctx context.Context, name string) error {
	dom, err := l.conn.LookupDomainByName(name)
	if err != nil {
		if isNotFound(err) {
			return fmt.Errorf("%w, lookup by name: %s", ErrorDomainNotFound, err)
		}
		return fmt.Errorf("lookup by name: %w", err)
	}

	err = dom.Destroy()
	if err != nil {
		if strings.Contains(err.Error(), "Requested operation is not valid: domain is not running") {
			return nil
		}
		return fmt.Errorf("stop: %w", err)
	}

	return nil
}

func (l *Libvirt) Remove(ctx context.Context, name string) error {
	dom, err := l.conn.LookupDomainByName(name)
	if err != nil {
		if strings.Contains(err.Error(), "Domain not found: no domain with matching name") {
			return nil
		}
		return fmt.Errorf("lookup by name: %w", err)
	}

	net, err := l.conn.LookupInterfaceByName(name)
	if err != nil {
		return fmt.Errorf("network lookup by name: %w", err)
	}
	err = net.Destroy(0)
	if err != nil {
		return fmt.Errorf("network destroy: %w", err)
	}

	desc, err := dom.GetXMLDesc(libvirt.DOMAIN_XML_MIGRATABLE)
	if err != nil {
		return fmt.Errorf("get xml desc: %w", err)
	}

	err = dom.Destroy()
	if err != nil {
		return fmt.Errorf("destroy: %w", err)
	}

	err = dom.Undefine()
	if err != nil {
		return fmt.Errorf("undefine: %w", err)
	}

	err = dom.Free()
	if err != nil {
		return fmt.Errorf("free: %w", err)
	}

	domCfg := &libvirtxml.Domain{}
	err = domCfg.Unmarshal(desc)
	if err != nil {
		return fmt.Errorf("unmarshal: %w", err)
	}

	if domCfg.Devices == nil || len(domCfg.Devices.Disks) != 1 || domCfg.Devices.Disks[0].Source == nil || domCfg.Devices.Disks[0].Source.File == nil {
		return fmt.Errorf("not valid disks in domain XML")
	}

	err = l.imageManager.RemoveImage(ctx, domCfg.Devices.Disks[0].Source.File.File)
	if err != nil {
		return fmt.Errorf("remove-image: %w", err)
	}

	return nil
}
