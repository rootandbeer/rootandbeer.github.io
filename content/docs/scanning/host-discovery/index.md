---
title: "Host Discovery"
date: 2025-12-28T19:02:56-08:00
draft: false
description: "Host discovery techniques for penetration testing, including ping sweeps, ARP scans, and Nmap host discovery methods to identify active systems and live hosts on target networks during security assessments."
noindex: false
featured: false
toc: true
pinned: false
nav_weight: 1
# comments: false
series:
#  - 
categories:
#  - 
tags:
  - nmap
  - fping
  - hping3
  - masscan
  - netdiscover
  - arpscan 
images:

#  - 
# menu:
#   main:
#     weight: 100
#     params:
#       icon:
#         vendor: bs
#         name: book
#         color: '#e24d0e'
meta:
  reading_time: false

---

## IPv4 Discovery

### Ping Sweep (Nmap)
Perform a basic host discovery scan across a subnet and extract live hosts:
```shell
nmap -sn $RHOST/24 -oG - | awk '/Up$/{print $2}' > output.scan
```
- `-sn` disables port scanning and performs host discovery only
- Outputs a list of responsive hosts to `output.scan`
- Relies on ICMP echo requests
- Use CIDR notation (e.g., `/24` for 256 hosts, `/16` for 65,536 hosts)

**Scan specific IP range:**
```shell
nmap -sn 192.168.1.1-254 -oG - | awk '/Up$/{print $2}' > output.scan
```

### TCP-Based Host Discovery
When ICMP is blocked, use TCP SYN or ACK probes against common ports to identify live hosts:
```shell
nmap -sn -PS22,80,443 $RHOST/24
```
```shell
nmap -sn -PA80,443 $RHOST/24
```
- `-PS` TCP SYN probe
- `-PA` TCP ACK probe
- Specify common ports likely to be open (22, 80, 443, 135, 139, 445)

**UDP-based host discovery:**
```shell
nmap -sn -PU53,161 $RHOST/24
```
- `-PU` UDP probe
- Useful when both ICMP and TCP are filtered

### ICMP Advanced Probes
Use different ICMP message types when standard ping is blocked:
```shell
nmap -sn -PP $RHOST/24  # ICMP timestamp request
```
```shell
nmap -sn -PM $RHOST/24  # ICMP address mask request
```

### Fping
Fast parallel ping tool for host discovery:
```shell
fping -a -g $RHOST/24 2>/dev/null
```
- `-a` show only alive hosts
- `-g` generate target list from network range
- Faster than sequential ping

**Scan from file:**
```shell
fping -a < hosts.txt
```

### Hping3
Advanced packet crafting tool for custom probes:
```shell
hping3 -1 $RHOST  # ICMP ping
```
```shell
hping3 -S -p 80 $RHOST  # TCP SYN to port 80
```
```shell
hping3 -2 -p 161 $RHOST  # UDP to port 161
```
- `-1` ICMP mode
- `-S` SYN flag
- `-2` UDP mode
- Useful for firewall testing and custom probe crafting

### Masscan
Ultra-fast host discovery and port scanning:
```shell
masscan $RHOST/24 -p0 --rate=1000
```
- `-p0` ping scan (host discovery only)
- `--rate` packets per second (adjust based on network)
- Much faster than nmap but less accurate

### Netdiscover Scan
Passive and active ARP-based host discovery. Useful when ICMP is blocked, but requires being on the same L2 segment:
```shell
sudo netdiscover -i eth0
```

**Active scan:**
```shell
sudo netdiscover -r $RHOST/24 -i eth0
```

**Passive scan (stealth):**
```shell
sudo netdiscover -p -i eth0
```

>[!important] Change `eth0` with your network interface using `ifconfig` or `ip addr`

### ARP Scan
Actively enumerate hosts on the local network using ARP requests and bypass ICMP restrictions:
```shell
arp-scan -l
```

**Scan specific network:**
```shell
arp-scan $RHOST/24
```

**Interface selection:**
```shell
arp-scan -I eth0 -l
```

## IPv6 Discovery

### Nmap IPv6 Host Discovery
```shell
nmap -6 -sn $RHOSTv6/64
```
- `-6` enable IPv6 scanning
- Use IPv6 CIDR notation (typically `/64` for subnets)

### Ping6
```shell
ping6 -c 3 $RHOSTv6
```

## Passive Discovery

Passive discovery techniques listen to network traffic without sending probes:

### Tcpdump/Wireshark
Monitor network traffic for host activity:
```shell
sudo tcpdump -i eth0 -n 'arp or icmp'
```

### Passive Network Mapping
Tools like `p0f` can identify hosts and OS from passive traffic analysis:
```shell
sudo p0f -i eth0
```

## When to Use Each Method

- **ICMP Ping**: Default method, fastest, but often blocked
- **TCP Probes**: When ICMP is filtered, more reliable
- **ARP**: Local network only, bypasses all filters
- **UDP Probes**: When ICMP and TCP are blocked
- **Passive**: Stealthiest, requires network access, slower
