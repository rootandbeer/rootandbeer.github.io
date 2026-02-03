---
title: "Port Scanning"
date: 2025-12-29T18:40:49-08:00
draft: false
description: "Port scanning techniques for penetration testing using Nmap, including TCP SYN scans, UDP scans, firewall evasion, and comprehensive port enumeration methods to identify open services and potential attack vectors."
noindex: false
featured: false
pinned: false
nav_weight: 2
toc: true
# comments: false
series:
#  - 
categories:
#  - 
tags:
  - nmap
  - masscan 
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
  date: false
---

## Port Scanning
Once live hosts are identified, perform port scanning to discover exposed services.

## Nmap Scan Types

### TCP SYN Scan (Stealth Scan)
Default and most common scan type. Fast and relatively stealthy:
```shell
nmap -sS $RHOST
```
- `-sS` SYN scan (half-open scan)
- Doesn't complete TCP handshake
- Requires root privileges on Unix systems
- Stealthier than full connect scan

### TCP ACK Scan
Determine if ports are filtered (firewall detection):
```shell
nmap -sA $RHOST
```
- `-sA` ACK scan
- Doesn't determine if port is open/closed
- Useful for firewall rule mapping

## Port Specification

### Common Port Lists
```shell
nmap -p 1-1000 $RHOST              # Port range
nmap -p 22,80,443,8080 $RHOST      # Specific ports
nmap -p- $RHOST                     # All 65,535 ports
nmap --top-ports 1000 $RHOST       # Top 1000 most common ports
nmap -sU -p 53,161,162 $RHOST  # Common UDP ports
nmap -p U:53,161,T:22,80,443 $RHOST # Mix UDP and TCP
```

## Comprehensive Scans

### Full Scan with Aggressive Options
```shell
nmap -p- -A -iL output.scan
```
- `-p-` scans all 65,535 TCP ports
- `-A` enables OS detection, version detection, scripts and traceroute
- `-iL` reads target hosts from a file

## Firewall Evasion

### Fragment Packets
```shell
nmap -f $RHOST                      # Fragment packets
nmap -f -f $RHOST                   # Double fragment (16 bytes)
```

### Decoy Scans
```shell
nmap -D RND:10 $RHOST               # 10 random decoys
nmap -D 192.168.1.1,192.168.1.2,ME $RHOST  # Specific decoys
```

### Spoof Source IP
```shell
nmap -S 192.168.1.100 -e eth0 $RHOST
```
- `-S` spoof source IP
- `-e` specify interface
- Note: Replies go to spoofed IP

### Idle Scan (Zombie Scan)
```shell
nmap -sI zombie.host.com $RHOST
```
- Uses a "zombie" host for scanning
- Very stealthy (target sees zombie, not you)
- Requires a suitable zombie host

### Source Port Spoofing
```shell
nmap --source-port 53 $RHOST        # Spoof as DNS traffic
nmap -g 53 $RHOST                   # Same as above
```

### Additional Evasion
```shell
nmap --data-length 200 $RHOST       # Append random data
nmap --badsum $RHOST                # Invalid checksum (firewall testing)
nmap -sS -f -T2 -D RND:5 $RHOST     # Combine multiple techniques
```

## Alternative Tools

### Masscan
Ultra-fast port scanner:
```shell
masscan $RHOST/24 -p1-65535 --rate=1000
masscan $RHOST -p80,443,8080 --rate=10000
```
- Much faster than nmap
- `--rate` packets per second
- Less accurate, may miss ports



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

**Scan Specific Ports:**
```shell
for port in 22 80 443 8080; do nc -zv $RHOST $port; done
```

{{< bs/alert info >}}
{{< markdownify >}}
**Netcat Flags**
- `-z` → zero-I/O scan mode
- `-v` → verbose
- `-w 1` → timeout (1 second)
- `-n` → don't resolve DNS
{{< /markdownify >}}
{{< /bs/alert >}}

## IPv6 Scanning

```shell
nmap -6 -sS $RHOSTv6                # IPv6 SYN scan
nmap -6 -sU $RHOSTv6                # IPv6 UDP scan
```

## Best Practices

1. **Start with top ports**: Use `--top-ports 1000` before full scans
2. **Use appropriate timing**: Balance speed vs stealth (`-T2` or `-T3` default)
3. **Respect rate limits**: Adjust `--rate` or timing to avoid overwhelming targets