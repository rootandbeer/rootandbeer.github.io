---
title: "Service Enumeration"
date: 2025-12-29T19:48:25-08:00
draft: false
description: "Service Enumeration"
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

## Banner Grabbing 
Banner grabbing retrieves service metadata exposed during initial connections, often revealing service type, version, or misconfigurations.

### Netcat
Manually connect to a service and inspect the response. Useful for FTP, SMTP, POP3, IMAP:
```shell
nc $RHOST 21
```

### Telnet
Alternative to Netcat and is commonly available.
```shell
telnet $RHOST 21
```

### Curl (http/s)
Retrieves the HTTP headers only. Reveals server type, framework and proxies.

```shell
curl -I http://$RHOST
```

```shell
curl -K -I https://$RHOST
```

>[!note] use `-k` flag for `https` 


### OpenSSL (TLS Services)
Inspect TLS services. Extracts certificate information and may reveal internal hostnames.
```shell
openssl s_client -connect $RHOST:443
```

---

## Service Version Detection
Version detection identifies the exact service and version running on an open port using protocol fingerprinting and behavioral analysis.

### Nmap Version Scans

Basic service and version detection

```shell
nmap -sV -p 22,80,443 $RHOST
```

\
Aggressive detection but slower and noisier.
```shell
nmap -sV --version-intensity 9 -p 22,80,443 $RHOST
```

\
Full scan with default scripts
```shell
nmap -sC -sV -p 22,80,443 $RHOST
```

\
UDP Version detection, slow
```shell
nmap -sU -sV -p 53,161 $RHOST
```

---

## Nmap NSE Scripts
Nmap Scripting Engine (NSE) scripts automate service enumeration, vulnerability detection, and misconfiguration discovery.

List of Nmap scripts:
```shell
ls /usr/share/nmap/scripts
```

Default Script is Safe and useful

```shell
nmap -sC -A $RHOST
```

Vulnerability Detection Script identifies known vulnerabilities
```shell
nmap --script vuln -p80,443 $RHOST
```

Service-specific scripts targets a specific service

```shell
nmap --script smb-* -p 445 $RHOST
```
```shell
nmap --script http-enum -p 80 $RHOST
```



