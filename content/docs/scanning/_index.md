---
title: "Scanning"
date: 2025-12-28T19:11:22-08:00
draft: false
description: "Network Scanning"
noindex: false
featured: false
pinned: false
nav_weight: 1
nav_icon:
  vendor: font-awesome-solid
  name: network-wired
  color: yellow
  classname: fa
# comments: false
series:
  - hacknotes
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

Network scanning is a critical phase in penetration testing that involves discovering active hosts, identifying open ports, enumerating services, and gathering information about target systems. This section covers the methodology and tools used for comprehensive network reconnaissance.

## Scanning Methodology

The scanning phase typically follows this workflow:

1. **Host Discovery** - Identify active systems on the target network
2. **Port Scanning** - Discover open ports and services on discovered hosts
3. **Service Enumeration** - Gather detailed information about running services
4. **Web Enumeration** - Specialized enumeration for web applications and services
5. **Vulnerability Scanning** - Identify security weaknesses and known vulnerabilities

{{< bs/alert info >}}
{{< markdownify >}}
**Best Practice**: Always start with host discovery before port scanning to avoid wasting time on non-existent hosts. Use stealth techniques when appropriate to avoid detection.
{{< /markdownify >}}
{{< /bs/alert >}}

## Setting Environment Variables

Before beginning scanning activities, set environment variables for commonly used targets:

```shell
export RHOST=192.168.0.1
export RPORT=80
export RDOMAIN=target.com
```

These variables can be referenced in commands using `$RHOST`, `$RPORT`, and `$RDOMAIN`.

## Quick Reference: Common Scanning Workflows

### Basic Network Scan
```shell
# 1. Discover hosts
nmap -sn $RHOST/24 -oG - | awk '/Up$/{print $2}' > hosts.txt

# 2. Scan common ports on discovered hosts
nmap -A -iL hosts.txt -oA scan_results

# 3. Review results
cat scan_results.nmap
```

### Stealth Scan Workflow
```shell
# 1. Host discovery with TCP probes
nmap -sn -PS22,80,443 $RHOST/24

# 2. Stealth port scan
nmap -sS -T2 -f -D RND:10 $RHOST

# 3. Service enumeration
nmap -sC -sV -p- $RHOST
```

### Web-Focused Scan
```shell
# 1. Port scan for web services
nmap -p 80,443,8000,8080,8443 $RHOST

# 2. Web enumeration
gobuster dir -u http://$RHOST -w /usr/share/wordlists/dirb/common.txt

# 3. Vulnerability scanning
nuclei -u http://$RHOST
```

### Complete Vulnerability Assessment
```shell
# 1. Service and version detection
nmap -sV -p- $RHOST -oA service_scan

# 2. Nmap vulnerability scripts
nmap --script vuln $RHOST

# 3. Search for known exploits
searchsploit $(grep "version" service_scan.nmap | head -1)

# 4. Web vulnerability scanning
nikto -h http://$RHOST
nuclei -u http://$RHOST -s critical,high
```
