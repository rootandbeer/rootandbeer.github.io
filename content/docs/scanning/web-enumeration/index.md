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

**Basic directory bruteforcing:**
```shell
gobuster dir -u http://$RHOST -w /usr/share/wordlists/dirb/common.txt
```

**Common options:**
```shell
gobuster dir -u http://$RHOST -e -r -w wordlist.txt -x html,htm,asp,aspx,cgi,php,txt,zip,bak -t 50
```

- `-e` Expanded mode: shows full URL
- `-r` Follow redirects
- `-w` wordlist
- `-x` file extensions to use
- `-t` threads
- `-k` Skip SSL certificate verification
- `-s` Status codes to include (default: 200,204,301,302,307,401,403)
- `-b` Status codes to exclude (blacklist)


**With authentication:**
```shell
gobuster dir -u http://$RHOST -w wordlist.txt -U admin -P password
```

### Ffuf
Fast web fuzzer written in Go

**Directory bruteforcing:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -e .php,.html,.txt,.bak
```

**Multiple filters:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -fs 100,200 -fc 403,404
```
- `-fs` Filter by response size
- `-fc` Filter by response code

### Dirb
Classic directory bruteforcing tool:
```shell
dirb http://$RHOST
dirb http://$RHOST /usr/share/wordlists/dirb/common.txt
dirb http://$RHOST -X .php,.html
dirb http://$RHOST -a "User-Agent: Custom"
```

>[!tip] Response Code Filtering
>- **200**: Success (found)
>- **301/302**: Redirect (may indicate valid path)
>- **403**: Forbidden (exists but protected)
>- **401**: Unauthorized (requires auth)
>- **404**: Not found (doesn't exist)

---

## Virtual Host Discovery
Virtual host discovery identifies additional websites hosted on the same IP by fuzzing the `Host` header.

### Gobuster VHOST Mode

```shell
gobuster vhost -u http://$RHOST -w vhosts.txt --append-domain
```

### Ffuf
Fast fuzzing for host header testing:

```shell
ffuf -u http://$RHOST -H "Host: FUZZ.$RDOMAIN.com" -w vhosts.txt
```

**Filter responses by size:**
```shell
ffuf -u http://$RHOST -H "Host: FUZZ.$RDOMAIN.com" -w vhosts.txt -fs 4242
```

**Filter by status code:**
```shell
ffuf -u http://$RHOST -H "Host: FUZZ.$RDOMAIN.com" -w vhosts.txt -fc 404
```

## Manual Host Header Testing

**HTTP:**
```shell
curl -H "Host: admin.target.com" http://$RHOST
```

\
When HTTPS is used
```shell
curl --resolve admin.$RDOMAIN.com:443:$RHOST https://admin.$RDOMAIN.com
```

---

## API Endpoint Discovery

### API Fuzzing with Ffuf
```shell
ffuf -u http://$RHOST/api/FUZZ -w api-endpoints.txt
ffuf -u http://$RHOST/api/v1/FUZZ -w api-endpoints.txt -X POST
```

### GraphQL Introspection
```shell
curl -X POST http://$RHOST/graphql -H "Content-Type: application/json" -d '{"query":"{__schema{types{name}}}"}'
```

---

## WAF Detection

### wafw00f
```shell
wafw00f http://$RHOST
wafw00f https://$RHOST
```

---

## Nuclei
Nuclei is a template-based scanner used to detect web vulnerabilities, misconfigurations, and exposed components.

### Basic Scans
```shell
nuclei -u http://$RHOST
```

Using specific template types:
```shell
nuclei -u http://$RHOST -t /path/to/templates/cves/
nuclei -u http://$RHOST -t /path/to/templates/misconfiguration/
nuclei -u http://$RHOST -t /path/to/templates/exposures/
```

### Severity Filtering
```shell
nuclei -u http://$RHOST -s critical,high
nuclei -u http://$RHOST -s low,medium,high,critical
```


### Rate Limiting & Stealth
Reduce noise and avoid blocking
```shell
nuclei -u http://$RHOST -rl 10 -c 5
```

---

## JavaScript File Analysis

### Extract JavaScript Files
```shell
curl -s http://$RHOST | grep -oP 'src="[^"]*\.js"' | cut -d'"' -f2
```

### Analyze JS for Endpoints
```shell
curl -s http://$RHOST/app.js | grep -oP '["\']/[^"\']*["\']'
```

### LinkFinder
```shell
python3 linkfinder.py -i http://$RHOST -o cli
```

---

## Manual Enumeration Techniques

### Check HTTP Methods
```shell
curl -X OPTIONS http://$RHOST -v
curl -X TRACE http://$RHOST
```

### Check for HTTP PUT
```shell
curl -X PUT http://$RHOST/test.txt -d "test"
```