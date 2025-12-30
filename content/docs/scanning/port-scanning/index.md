---
title: "Port Scanning"
date: 2025-12-29T18:40:49-08:00
draft: false
description: "Port scanning identifies open ports on a target system to reveal exposed services and potential attack vectors."
noindex: false
featured: false
pinned: false
toc: true
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