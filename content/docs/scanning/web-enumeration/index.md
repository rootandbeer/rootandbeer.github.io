---
title: "Web Enumeration"
date: 2025-12-30T12:18:06-08:00
draft: false
description: "Web Enumeration"
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

## Directory & File Bruteforcing
Directory bruteforcing discovers hidden files and directories by sending requests from a wordlist and analyzing responses.

### Gobuster

```shell
gobuster dir -u http://$RHOST -w /usr/share/wordlists/dirb/common.txt
```

Common options:
```shell
gobuster dir -u http://$RHOST -e -r -w wordlist.txt -x html,htm,asp,aspx,cgi,php,txt,zip,bak -t 50
```

- `-e` Expanded mode: shows full URL
- `-r` Follow redirects
- `-w` wordlist
- `-x` file extensions to use
- `-t` threads

---

## Virtual Host Discovery
Virtual host discovery identifies additional websites hosted on the same IP by fuzzing the `Host` header.

### Gobuster VHOST Mode

```shell
gobuster vhost -u http://$RHOST -w vhosts.txt --append-domain
```

### Ffuf
Fast fuzzing for host header testing

>[!note] Variable `$RHOST` is assumed to be the IP address of target, therefore `target.com` needs to be changed to the actualy domain.

```shell
ffuf -u http://$RHOST -H "Host: FUZZ.target.com" -w vhosts.txt
```

\
Filter Responses
```shell
ffuf -u http://$RHOST -H "Host: FUZZ.target.com" -w vhosts.txt -fs 4242
```


## Manual Host Header Testing

>[!note] Variable `$RHOST` is assumed to be the IP address of target, therefore `target.com` needs to be changed to the actualy domain.

```shell
curl -H "Host: admin.target.com" http://$RHOST
```

\
When HTTPS is used
```shell
curl --resolve admin.target.com:443:$RHOST https://admin.target.com
```

## Nuclei
Nuclei is a template-based scanner used to detect web vulnerabilities, misconfigurations, and exposed components.

### Basic Scans
```shell
nuclei -u http://$RHOST
```

Using specific template types:
```shell
nuclei -u http://$RHOST -t cves/
```
```shell
nuclei -u http://$RHOST -t misconfiguration/
```
```shell
nuclei -u http://$RHOST -t exposures
```

### Rate Limiting & Stealth
Reduce noise and avoid blocking
```shell
nuclei -u http://$RHOST -rl 10 -c 5
```