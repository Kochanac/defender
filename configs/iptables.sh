#!/bin/sh


iptables -t nat -F LIBVIRT_PRT


iptables -t nat -A LIBVIRT_PRT -s 10.111.5.0/25 -d 224.0.0.0/24 -j RETURN
iptables -t nat -A LIBVIRT_PRT -s 10.111.5.0/25 -d 255.255.255.255/32 -j RETURN

iptables -t nat -A LIBVIRT_PRT -s 10.111.5.0/25 ! -d 10.111.0.0/16 -p tcp -j MASQUERADE --to-ports 1024-65535
iptables -t nat -A LIBVIRT_PRT -s 10.111.5.0/25 ! -d 10.111.0.0/16 -p udp -j MASQUERADE --to-ports 1024-65535

iptables -t nat -A LIBVIRT_PRT -s 10.111.5.0/25 ! -d 10.111.0.0/16 -j MASQUERADE

# for default network idk
iptables -t nat -A LIBVIRT_PRT -s 192.168.122.0/24 -d 224.0.0.0/24 -j RETURN
iptables -t nat -A LIBVIRT_PRT -s 192.168.122.0/24 -d 255.255.255.255/32 -j RETURN
iptables -t nat -A LIBVIRT_PRT -s 192.168.122.0/24 ! -d 192.168.122.0/24 -p tcp -j MASQUERADE --to-ports 1024-65535
iptables -t nat -A LIBVIRT_PRT -s 192.168.122.0/24 ! -d 192.168.122.0/24 -p udp -j MASQUERADE --to-ports 1024-65535
iptables -t nat -A LIBVIRT_PRT -s 192.168.122.0/24 ! -d 192.168.122.0/24 -j MASQUERADE



iptables -F LIBVIRT_FWI

# iptables -A FORWARD -j LIBVIRT_FWI
iptables -A LIBVIRT_FWI -d 10.111.5.0/25 -o virbr1 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
iptables -A LIBVIRT_FWI -s 10.111.0.0/16 -d 10.111.5.0/25 -o virbr1 -j ACCEPT
iptables -A LIBVIRT_FWI -o virbr1 -j REJECT --reject-with icmp-port-unreachable
