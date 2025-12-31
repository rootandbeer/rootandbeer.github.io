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
- `-q` Quiet mode (no banner)
- `-o` Output file

**With authentication:**
```shell
gobuster dir -u http://$RHOST -w wordlist.txt -U admin -P password
```

**DNS mode (subdomain bruteforcing):**
```shell
gobuster dns -d $RDOMAIN -w subdomains.txt
```

### Ffuf
Fast web fuzzer written in Go:

**Directory bruteforcing:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -e .php,.html,.txt
```

**Filter by response size:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -fs 4242
```

**Filter by response code:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -fc 404
```

**Multiple filters:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -fs 100,200 -fc 403,404
```

**Rate limiting:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -t 10 -rate 100
```

**With extensions:**
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -e .php,.bak,.old
```

### Dirb
Classic directory bruteforcing tool:
```shell
dirb http://$RHOST
dirb http://$RHOST /usr/share/wordlists/dirb/common.txt
dirb http://$RHOST -X .php,.html
dirb http://$RHOST -a "User-Agent: Custom"
```

### Dirsearch
Fast and advanced web content scanner:
```shell
dirsearch -u http://$RHOST
dirsearch -u http://$RHOST -w wordlist.txt
dirsearch -u http://$RHOST -e php,html,txt
dirsearch -u http://$RHOST --full-url
```

### Feroxbuster
Fast, recursive content discovery tool:
```shell
feroxbuster -u http://$RHOST
feroxbuster -u http://$RHOST -w wordlist.txt
feroxbuster -u http://$RHOST -x php,html,txt
feroxbuster -u http://$RHOST --recursive
```

### Common Wordlists
```shell
/usr/share/wordlists/dirb/common.txt
/usr/share/wordlists/dirb/big.txt
/usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
/usr/share/seclists/Discovery/Web-Content/common.txt
/usr/share/seclists/Discovery/Web-Content/directory-list-2.3-medium.txt
```

### Response Code Filtering
- **200**: Success (found)
- **301/302**: Redirect (may indicate valid path)
- **403**: Forbidden (exists but protected)
- **401**: Unauthorized (requires auth)
- **404**: Not found (doesn't exist)

---

## Virtual Host Discovery
Virtual host discovery identifies additional websites hosted on the same IP by fuzzing the `Host` header.

### Gobuster VHOST Mode

```shell
gobuster vhost -u http://$RHOST -w vhosts.txt --append-domain
gobuster vhost -u http://$RHOST -w vhosts.txt -t 50
```

### Ffuf
Fast fuzzing for host header testing:

>[!note] Variable `$RHOST` is assumed to be the IP address of target, therefore `target.com` needs to be changed to the actual domain.

```shell
ffuf -u http://$RHOST -H "Host: FUZZ.target.com" -w vhosts.txt
```

**Filter responses by size:**
```shell
ffuf -u http://$RHOST -H "Host: FUZZ.target.com" -w vhosts.txt -fs 4242
```

**Filter by status code:**
```shell
ffuf -u http://$RHOST -H "Host: FUZZ.target.com" -w vhosts.txt -fc 404
```

### Manual Host Header Testing

>[!note] Variable `$RHOST` is assumed to be the IP address of target, therefore `target.com` needs to be changed to the actual domain.

**HTTP:**
```shell
curl -H "Host: admin.target.com" http://$RHOST
curl -H "Host: admin.target.com" http://$RHOST -v
```

**HTTPS:**
```shell
curl --resolve admin.target.com:443:$RHOST https://admin.target.com
curl -k -H "Host: admin.target.com" https://$RHOST
```

**With custom headers:**
```shell
curl -H "Host: admin.target.com" -H "X-Forwarded-Host: admin.target.com" http://$RHOST
```

---

## Subdomain Enumeration

### Sublist3r
```shell
sublist3r -d $RDOMAIN
sublist3r -d $RDOMAIN -t 10
sublist3r -d $RDOMAIN -b
```

### Amass
```shell
amass enum -d $RDOMAIN
amass enum -d $RDOMAIN -active
amass enum -d $RDOMAIN -brute -w wordlist.txt
```

### Subfinder
```shell
subfinder -d $RDOMAIN
subfinder -d $RDOMAIN -o subdomains.txt
subfinder -d $RDOMAIN -all
```

### DNSrecon
```shell
dnsrecon -d $RDOMAIN -t brt -D subdomains.txt
```

### DNSenum
```shell
dnsenum $RDOMAIN
dnsenum --enum $RDOMAIN
```

### Manual DNS Queries
```shell
for sub in www admin mail ftp test; do dig $sub.$RDOMAIN +short; done
```

### Certificate Transparency
```shell
# Use online tools or:
curl -s "https://crt.sh/?q=%25.$RDOMAIN&output=json" | jq -r '.[].name_value' | sort -u
```

---

## Technology Stack Identification

### WhatWeb
```shell
whatweb http://$RHOST
whatweb http://$RHOST -a 3
whatweb -i targets.txt
```

### Wappalyzer
Browser extension or CLI:
```shell
wappalyzer http://$RHOST
```

### BuiltWith
Online service or API for technology detection.

### Manual Inspection
```shell
curl -I http://$RHOST | grep -i "server\|x-powered\|x-aspnet"
curl -s http://$RHOST | grep -i "generator\|powered"
```

### Check Common Paths
```shell
curl http://$RHOST/phpinfo.php
curl http://$RHOST/server-status
curl http://$RHOST/.env
curl http://$RHOST/package.json
```

---

## SSL/TLS Certificate Analysis

### OpenSSL
```shell
openssl s_client -connect $RHOST:443 -showcerts
echo | openssl s_client -connect $RHOST:443 2>/dev/null | openssl x509 -noout -text
echo | openssl s_client -connect $RHOST:443 2>/dev/null | openssl x509 -noout -dates
```

### SSL Labs
Use online SSL Labs test: `https://www.ssllabs.com/ssltest/analyze.html?d=$RDOMAIN`

### Certificate Transparency Logs
```shell
curl -s "https://crt.sh/?q=%25.$RDOMAIN&output=json" | jq -r '.[].name_value' | sort -u
```

### TestSSL
```shell
testssl.sh $RHOST
```

### SSLyze
```shell
sslyze $RHOST
sslyze --regular $RHOST
```

---

## Robots.txt and Sitemap

### Check robots.txt
```shell
curl http://$RHOST/robots.txt
curl http://$RHOST/robots.txt | grep -i "disallow\|allow"
```

### Check sitemap.xml
```shell
curl http://$RHOST/sitemap.xml
curl http://$RHOST/sitemap_index.xml
```

### Common Files to Check
```shell
curl http://$RHOST/.git/config
curl http://$RHOST/.env
curl http://$RHOST/backup.sql
curl http://$RHOST/config.php.bak
curl http://$RHOST/web.config
```

---

## API Endpoint Discovery

### Manual Testing
```shell
curl http://$RHOST/api/
curl http://$RHOST/api/v1/
curl http://$RHOST/rest/
curl http://$RHOST/graphql
```

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

### Manual Detection
```shell
curl http://$RHOST/?test=<script>alert(1)</script>
curl http://$RHOST/?test=../../etc/passwd
# Look for WAF-specific headers or error messages
```

### Check Headers
```shell
curl -I http://$RHOST | grep -i "cloudflare\|akamai\|sucuri\|incapsula"
```

---

## Nuclei
Nuclei is a template-based scanner used to detect web vulnerabilities, misconfigurations, and exposed components.

### Basic Scans
```shell
nuclei -u http://$RHOST
nuclei -u http://$RHOST -templates-path /path/to/templates
```

### Using Specific Template Types
```shell
nuclei -u http://$RHOST -t cves/
nuclei -u http://$RHOST -t misconfiguration/
nuclei -u http://$RHOST -t exposures/
nuclei -u http://$RHOST -t vulnerabilities/
nuclei -u http://$RHOST -t technologies/
```

### Severity Filtering
```shell
nuclei -u http://$RHOST -s critical,high
nuclei -u http://$RHOST -s low,medium,high,critical
```

### Tag Filtering
```shell
nuclei -u http://$RHOST -tags cve
nuclei -u http://$RHOST -tags xss
nuclei -u http://$RHOST -tags rce
```

### Rate Limiting & Stealth
```shell
nuclei -u http://$RHOST -rl 10 -c 5
nuclei -u http://$RHOST -rl 5 -c 3 -rate-limit 10
```

### Output Options
```shell
nuclei -u http://$RHOST -o results.txt
nuclei -u http://$RHOST -o results.json -json
nuclei -u http://$RHOST -o results.txt -silent
```

### Update Templates
```shell
nuclei -update-templates
```

### Scan from File
```shell
nuclei -l targets.txt
```

### Exclude Templates
```shell
nuclei -u http://$RHOST -etags intrusive
```

---

## Nikto
Web server scanner that performs comprehensive tests:

```shell
nikto -h http://$RHOST
nikto -h http://$RHOST -p 80,443,8080
nikto -h http://$RHOST -Format txt -o nikto.txt
nikto -h http://$RHOST -Tuning 1,2,3,4,5,6,7,8,9
```

**Tuning options:**
- 1: File Upload
- 2: Interesting File / Seen in logs
- 3: Misconfiguration / Default Files
- 4: Information Disclosure
- 5: Injection (XSS/Script/HTML)
- 6: Remote File Retrieval - Inside Web Root
- 7: Denial of Service
- 8: Remote File Retrieval - Server Wide
- 9: Authentication Bypass

---

## Parameter Fuzzing

### Ffuf Parameter Fuzzing
```shell
ffuf -u http://$RHOST/page?FUZZ=test -w parameters.txt
ffuf -u http://$RHOST/page?FUZZ=test -w parameters.txt -X POST
ffuf -u http://$RHOST/page?FUZZ=test -w parameters.txt -d "FUZZ=test"
```

### Arjun
```shell
arjun -u http://$RHOST/page
arjun -u http://$RHOST/page --include-subs
```

### ParamSpider
```shell
paramspider -d $RDOMAIN
paramspider -d $RDOMAIN --level 2
```

---

## Backup File Discovery

### Common Backup Extensions
```shell
# Test with common extensions
for ext in bak old tmp swp ~; do curl -s -o /dev/null -w "%{http_code}" http://$RHOST/file.$ext; done
```

### Ffuf for Backup Files
```shell
ffuf -u http://$RHOST/FUZZ -w wordlist.txt -e .bak,.old,.tmp,.swp,~
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

### Check for Directory Listing
```shell
curl http://$RHOST/
curl http://$RHOST/directory/
```

### Check for Default Credentials
```shell
# Test common default credentials for admin panels, etc.
curl -u admin:admin http://$RHOST/admin
```

---

## Burp Suite Integration

While Burp Suite is primarily GUI-based, it can be used alongside command-line tools:
- Use Burp to intercept and analyze requests
- Export interesting endpoints for further fuzzing
- Use Burp extensions for additional enumeration
- Integrate with Intruder for custom fuzzing

---

## Best Practices

1. **Start with passive reconnaissance**: Use subdomain enumeration and certificate transparency
2. **Check robots.txt and sitemap first**: Often reveals hidden paths
3. **Identify technology stack**: Helps choose appropriate wordlists and techniques
4. **Use multiple tools**: Different tools may find different results
5. **Respect rate limits**: Adjust thread counts and delays
6. **Save all output**: Document findings for later analysis
7. **Verify findings manually**: Automated tools may produce false positives
8. **Check for WAF**: Adjust techniques if WAF is detected