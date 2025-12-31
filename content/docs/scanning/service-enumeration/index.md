---
title: "Service Enumeration"
date: 2025-12-29T19:48:25-08:00
draft: false
description: "Service enumeration gathers detailed information about running services, including versions and configurations, to identify weaknesses and viable attack paths."
noindex: false
featured: false
pinned: false
nav_weight: 3
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

>[!important] What to Look For in Banners
>- **Service versions**: Apache/2.4.41, OpenSSH_7.4
>- **OS information**: Windows, Linux distributions
>- **Framework details**: PHP/7.4.3, Django/3.1
>- **Server software**: nginx, IIS, Apache
>- **Custom headers**: X-Powered-By, Server tokens
>- **Error messages**: May reveal paths, versions, configurations


### Netcat
Manually connect to a service and inspect the response. Useful for FTP, SMTP, POP3, IMAP:

```shell
nc $RHOST 21 #FTP
```

**Send commands after connection:**
```shell
echo "QUIT" | nc $RHOST 21
```

### Telnet
Alternative to Netcat and is commonly available:
```shell
telnet $RHOST 21
```

### Curl (HTTP/HTTPS)
Retrieves the HTTP headers only. Reveals server type, framework and proxies:

```shell
curl -I http://$RHOST
curl -I http://$RHOST:8080
```

**HTTPS with certificate info:**
```shell
curl -k -I https://$RHOST
curl -v https://$RHOST 2>&1 | grep -i "server\|x-powered"
```

>[!note] Use `-k` flag for HTTPS to ignore certificate errors

**Custom headers:**
```shell
curl -H "User-Agent: Mozilla/5.0" -I http://$RHOST
```

### OpenSSL (TLS Services)
Inspect TLS services. Extracts certificate information and may reveal internal hostnames:
```shell
openssl s_client -connect $RHOST:443
openssl s_client -connect $RHOST:443 -showcerts
```

**Get certificate only:**
```shell
echo | openssl s_client -connect $RHOST:443 2>/dev/null | openssl x509 -noout -text
```

**Check certificate validity:**
```shell
echo | openssl s_client -connect $RHOST:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Service Version Detection
Version detection identifies the exact service and version running on an open port using protocol fingerprinting and behavioral analysis.

### Nmap Version Scans

**Basic service and version detection:**
```shell
nmap -sV -p 22,80,443 $RHOST
```

**Aggressive detection (slower but more accurate):**
```shell
nmap -sV --version-intensity 9 -p 22,80,443 $RHOST
```

**Light detection (faster):**
```shell
nmap -sV --version-light -p 22,80,443 $RHOST
```

**Full scan with default scripts:**
```shell
nmap -sC -sV -p 22,80,443 $RHOST
```

**UDP version detection (slow):**
```shell
nmap -sU -sV -p 53,161 $RHOST
```

**All ports with version detection:**
```shell
nmap -sV -p- $RHOST
```

---

## Nmap NSE Scripts
Nmap Scripting Engine (NSE) scripts automate service enumeration, vulnerability detection, and misconfiguration discovery.

**List available scripts:**
```shell
ls /usr/share/nmap/scripts
```

**Default safe scripts:**
```shell
nmap -sC -A $RHOST
```

**Vulnerability detection:**
```shell
nmap --script vuln -p80,443 $RHOST
```

Service-specific scripts targets a specific service

```shell
nmap --script smb-* -p 445 $RHOST
```

### Combine Results
```shell
cat *.nmap > combined_results.txt
grep -h "open" *.nmap | sort -u
```

>[!note] Must use flag `-o` in Nmap scans to combine results


