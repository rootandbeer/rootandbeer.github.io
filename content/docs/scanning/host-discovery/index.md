---
title: "Host Discovery"
date: 2025-12-28T19:02:56-08:00
draft: false
description: "Host scanning identifies active systems within a target network for further enumeration and exploitation. It is typically performed before port and service scanning."
noindex: false
featured: false
toc: true
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

## IPv4 Discovery

### Ping Sweep (Nmap)
Perform a basic host discovery scan across a subnet and extract live hosts:
```shell
nmap -sn $RHOST/24 -oG - | awk '/Up$/{print $2}' > output.scan
```
- `sn` disables port scanning and performs host discovery only
- Outputs a list of responsive hosts to `output.scan`
- Relies on ICMP echo requests

### TCP-Based Host Discovery
When ICMP is blocked use TCP SYN or ACK Probes against common ports to identify live hosts:
```shell
nmap -sn -PS22,80,443 $RHOST/24
```
```shell
nmap -sn -PA80,443 $RHOST/24
```
- `-PS` TCP SYN probe
- `-PA` TCP ACK probe


### Netdiscover Scan
Passive and active ARP-based host discovery. Useful when ICMP is blocked, but requires being on the same L2 segment:
```shell
sudo netdiscover -i eth0
```
>[!important] Change `eth0` with your network interface using `ifconfig`

### ARP Scan
Actively enumerate host on the local network using ARP requests and bypass ICMP restrictions.
```shell
arp-scan -l
```
