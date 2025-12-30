---
title: "Host Discovery"
date: 2025-12-28T19:02:56-08:00
draft: false
description: "Host scanning identifies active systems within a target network for further enumeration and exploitation. It is typically performed before port and service scanning."
noindex: false
featured: false
pinned: false
# comments: false
series:
#  - 
categories:
#  - 
tags:
#  - 
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
---

## Initial Discovery

### Ping Sweep (Nmap)
Perform a basic host discovery scan across a subnet and extract live hosts:
```shell
nmap -sn $RHOST/24 -oG - | awk '/Up$/{print $2}' > output.scan
```
- `sn` disables port scanning and performs host discovery only
- Outputs a list of responsive hosts to `output.scan`

### Netdiscover scan
Passive and active ARP-based host discovery. Useful when ICMP is blocked:
```shell
sudo netdiscover -i eth0
```

### ARP Scan
Actively enumerate host on the local network using ARP requests.
```shell
arp-scan -l
```
Fast and reliable for local network discovery.

## Port Scanning
Once live hosts are identified, perform port scanning to discover exposed services.

### Nmap

Scan all TCP ports on hosts discovered during the ping sweep:
```shell
nmap -p- -A -iL output.scan
```
- `-p-` scans all 65,535 TCP ports
- `-A` enables OS detection, version detection, scripts and traceroute
- `-iL-` reads target hosts from a file

### Netcat
Lightweight port scanning using Netcat. Typically installed on most hosts and useful when other tools like `Nmap` are not available.

**Scan Common Ports:**
```shell
nc -zv $RHOST 1-1024
```

\
**Quiet Output (Open Ports Only):**
```shell
nc -z $RHOST 1-65535 2>/dev/null
```

{{< bs/alert info >}}
{{< markdownify >}}
**Optional Netcat Flags**
- `-z` → zero-I/O scan mode
- `-v` → verbose
- `-w 1` → timeout
{{< /markdownify >}}
{{< /bs/alert >}}