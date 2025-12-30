---
title: "Host Discovery"
date: 2025-12-28T19:02:56-08:00
draft: false
description: "Scans for host discovery"
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

Initial ping sweep of the network:
```shell
nmap -sn $RHOST/24 -oG - | awk '/Up$/{print $2}' > output.scan
```

Netdiscover scan:
```shell
sudo netdiscover -i eth0
```

Arpscan:
```shell
arp-scan -l
```

## Port Scanning

### Nmap

Nmap scan hosts from initial ping sweep
```shell
nmap -p- -A -iL output.scan
```

### Netcat

Scan common ports
```shell
nc -zv $RHOST 1-1024
```

Quiet output (open ports only)
```shell
nc -z $RHOST 1-65535 2>/dev/null
```

{{< bs/alert info >}}
{{< markdownify >}}
**Optional Flags**
- `-z` → zero-I/O scan mode
- `-v` → verbose
- `-w 1` → timeout
{{< /markdownify >}}
{{< /bs/alert >}}