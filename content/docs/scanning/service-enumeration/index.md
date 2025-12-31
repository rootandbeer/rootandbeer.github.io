---
title: "Service Enumeration"
date: 2025-12-29T19:48:25-08:00
draft: false
description: "Service enumeration gathers detailed information about running services, including versions and configurations, to identify weaknesses and viable attack paths."
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

## Banner Grabbing 
Banner grabbing retrieves service metadata exposed during initial connections, often revealing service type, version, or misconfigurations.

### Netcat
Manually connect to a service and inspect the response. Useful for FTP, SMTP, POP3, IMAP:
```shell
nc $RHOST 21    # FTP
nc $RHOST 25    # SMTP
nc $RHOST 110   # POP3
nc $RHOST 143   # IMAP
```

**Send commands after connection:**
```shell
echo "QUIT" | nc $RHOST 21
```

### Telnet
Alternative to Netcat and is commonly available:
```shell
telnet $RHOST 21
telnet $RHOST 25
```

### Curl (HTTP/HTTPS)
Retrieves the HTTP headers only. Reveals server type, framework and proxies:

```shell
curl -I http://$RHOST
curl -I http://$RHOST:8080
```

**HTTPS with certificate info:**
```shell
curl -k -I https://$RHOST
curl -v https://$RHOST 2>&1 | grep -i "server\|x-powered"
```

>[!note] Use `-k` flag for HTTPS to ignore certificate errors

**Custom headers:**
```shell
curl -H "User-Agent: Mozilla/5.0" -I http://$RHOST
```

### OpenSSL (TLS Services)
Inspect TLS services. Extracts certificate information and may reveal internal hostnames:
```shell
openssl s_client -connect $RHOST:443
openssl s_client -connect $RHOST:443 -showcerts
```

**Get certificate only:**
```shell
echo | openssl s_client -connect $RHOST:443 2>/dev/null | openssl x509 -noout -text
```

**Check certificate validity:**
```shell
echo | openssl s_client -connect $RHOST:443 2>/dev/null | openssl x509 -noout -dates
```

### HTTPie
Modern alternative to curl with better formatting:
```shell
http $RHOST
http HEAD $RHOST
```

### What to Look For in Banners
- **Service versions**: Apache/2.4.41, OpenSSH_7.4
- **OS information**: Windows, Linux distributions
- **Framework details**: PHP/7.4.3, Django/3.1
- **Server software**: nginx, IIS, Apache
- **Custom headers**: X-Powered-By, Server tokens
- **Error messages**: May reveal paths, versions, configurations

---

## Service Version Detection
Version detection identifies the exact service and version running on an open port using protocol fingerprinting and behavioral analysis.

### Nmap Version Scans

**Basic service and version detection:**
```shell
nmap -sV -p 22,80,443 $RHOST
```

**Aggressive detection (slower but more accurate):**
```shell
nmap -sV --version-intensity 9 -p 22,80,443 $RHOST
```

**Light detection (faster):**
```shell
nmap -sV --version-light -p 22,80,443 $RHOST
```

**Full scan with default scripts:**
```shell
nmap -sC -sV -p 22,80,443 $RHOST
```

**UDP version detection (slow):**
```shell
nmap -sU -sV -p 53,161 $RHOST
```

**All ports with version detection:**
```shell
nmap -sV -p- $RHOST
```

---

## Nmap NSE Scripts
Nmap Scripting Engine (NSE) scripts automate service enumeration, vulnerability detection, and misconfiguration discovery.

**List available scripts:**
```shell
ls /usr/share/nmap/scripts
```

**Search for specific scripts:**
```shell
ls /usr/share/nmap/scripts | grep http
ls /usr/share/nmap/scripts | grep smb
```

**Default safe scripts:**
```shell
nmap -sC -A $RHOST
nmap --script default $RHOST
```

**Vulnerability detection:**
```shell
nmap --script vuln -p80,443 $RHOST
nmap --script vuln --script-args=unsafe=1 $RHOST
```

**Service-specific scripts:**

**HTTP enumeration:**
```shell
nmap --script http-enum -p 80,443,8080 $RHOST
nmap --script http-methods -p 80 $RHOST
nmap --script http-headers -p 80 $RHOST
nmap --script http-robots.txt -p 80 $RHOST
nmap --script "http-*" -p 80 $RHOST
```

**SMB enumeration:**
```shell
nmap --script smb-enum-shares -p 445 $RHOST
nmap --script smb-enum-users -p 445 $RHOST
nmap --script smb-os-discovery -p 445 $RHOST
nmap --script "smb-*" -p 445 $RHOST
```

**DNS enumeration:**
```shell
nmap --script dns-brute $RHOST
nmap --script dns-srv-enum --script-args dns-srv-enum.domain=$RDOMAIN
```

**SNMP enumeration:**
```shell
nmap --script snmp-info -p 161 $RHOST
nmap --script snmp-brute -p 161 $RHOST
nmap --script "snmp-*" -p 161 $RHOST
```

**SSH enumeration:**
```shell
nmap --script ssh-hostkey -p 22 $RHOST
nmap --script ssh2-enum-algos -p 22 $RHOST
nmap --script ssh-auth-methods -p 22 $RHOST
```

**FTP enumeration:**
```shell
nmap --script ftp-anon -p 21 $RHOST
nmap --script ftp-bounce -p 21 $RHOST
nmap --script "ftp-*" -p 21 $RHOST
```

**MySQL enumeration:**
```shell
nmap --script mysql-enum -p 3306 $RHOST
nmap --script mysql-users --script-args mysqluser=root -p 3306 $RHOST
```

**Multiple script categories:**
```shell
nmap --script "discovery,safe" $RHOST
nmap --script "intrusive" $RHOST  # Use with caution
```

---

## Service-Specific Enumeration Tools

### SMB/CIFS Enumeration

**enum4linux:**
```shell
enum4linux -a $RHOST
enum4linux -U $RHOST              # User enumeration
enum4linux -S $RHOST               # Share enumeration
enum4linux -P $RHOST               # Password policy
enum4linux -G $RHOST               # Group enumeration
```

**smbclient:**
```shell
smbclient -L //$RHOST
smbclient -L //$RHOST -N           # No password
smbclient //$RHOST/share -N        # Connect to share
```

**rpcclient:**
```shell
rpcclient -U "" $RHOST
rpcclient -U "" -N $RHOST
```

**smbmap:**
```shell
smbmap -H $RHOST
smbmap -H $RHOST -u guest -p ""
smbmap -H $RHOST -R share          # Recursive listing
```

**CrackMapExec (SMB):**
```shell
crackmapexec smb $RHOST
crackmapexec smb $RHOST --shares
crackmapexec smb $RHOST --users
crackmapexec smb $RHOST --pass-pol
```

### DNS Enumeration

**dnsenum:**
```shell
dnsenum $RDOMAIN
dnsenum --enum $RDOMAIN
```

**dnsrecon:**
```shell
dnsrecon -d $RDOMAIN
dnsrecon -d $RDOMAIN -t std
dnsrecon -d $RDOMAIN -t brt
```

**dig:**
```shell
dig $RDOMAIN
dig $RDOMAIN MX
dig $RDOMAIN NS
dig $RDOMAIN TXT
dig axfr @$RHOST $RDOMAIN          # Zone transfer
```

**nslookup:**
```shell
nslookup $RDOMAIN
nslookup -type=MX $RDOMAIN
```

**fierce:**
```shell
fierce -dns $RDOMAIN
```

### SNMP Enumeration

**snmpwalk:**
```shell
snmpwalk -c public -v1 $RHOST
snmpwalk -c public -v2c $RHOST
snmpwalk -c private -v2c $RHOST
```

**onesixtyone:**
```shell
onesixtyone -c community.txt $RHOST
onesixtyone -c public $RHOST
```

**snmp-check:**
```shell
snmp-check $RHOST
snmp-check -c public $RHOST
```

### LDAP Enumeration

**ldapsearch:**
```shell
ldapsearch -x -h $RHOST -s base
ldapsearch -x -h $RHOST -b "dc=example,dc=com"
ldapsearch -x -h $RHOST -D "cn=admin,dc=example,dc=com" -w password
```

**ldapdomaindump:**
```shell
ldapdomaindump $RHOST
```

### FTP Enumeration

**Manual FTP commands:**
```shell
ftp $RHOST
# Commands: USER, PASS, PASV, LIST, NLST
```

**Hydra FTP brute force:**
```shell
hydra -l admin -P passwords.txt ftp://$RHOST
```

### SSH Enumeration

**ssh-audit:**
```shell
ssh-audit $RHOST
ssh-audit -p 2222 $RHOST
```

**Manual SSH connection:**
```shell
ssh -v $RHOST                      # Verbose connection
ssh -o PreferredAuthentications=none $RHOST
```

### Database Enumeration

**MySQL:**
```shell
mysql -h $RHOST -u root
mysql -h $RHOST -u root -p
```

**PostgreSQL:**
```shell
psql -h $RHOST -U postgres
```

**MSSQL:**
```shell
sqsh -S $RHOST -U sa
```

**MongoDB:**
```shell
mongo $RHOST:27017
```

**NoSQLMap:**
```shell
nosqlmap -t $RHOST
```

### RPC Enumeration

**rpcinfo:**
```shell
rpcinfo -p $RHOST
rpcinfo -p $RHOST | grep nfs
```

**rpcclient (for SMB RPC):**
```shell
rpcclient $RHOST -U ""
```

---

## Automated Enumeration Tools

### AutoRecon
Multi-threaded network reconnaissance tool:
```shell
autorecon $RHOST
autorecon -t $RHOST                # Single target
```

### Reconnoitre
Automated security reconnaissance:
```shell
reconnoitre -t $RHOST -o output/
```

### NmapAutomator
Automated nmap scanning and enumeration:
```shell
./nmapAutomator.sh -H $RHOST -t All
```

---

## Parsing and Analyzing Results

### Extract Open Ports from Nmap
```shell
grep "open" scan.xml | cut -d'"' -f4
```

### Extract Service Versions
```shell
grep -i "version" scan.nmap
```

### Parse Nmap XML Output
```shell
nmap -oX scan.xml $RHOST
# Use tools like nmap-parse-output or custom scripts
```

### Combine Results
```shell
cat *.nmap > combined_results.txt
grep -h "open" *.nmap | sort -u
```



