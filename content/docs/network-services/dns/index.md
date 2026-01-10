---
title: "53: DNS"
date: 2026-01-09T19:13:35-08:00
draft: false
description: "Pentesting DNS (Domain Name System)"
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

DNS (Domain Name System) runs on port 53 and translates domain names to IP addresses. DNS servers often contain misconfigurations that can reveal internal network structure, hostnames, and sensitive information through zone transfers, subdomain enumeration, and information disclosure.

## Enumeration

### Version Detection

**Nmap service scan:**
```shell
nmap -sV -sU -p 53 $RHOST
nmap -sC -sV -sU -p 53 $RHOST
```

\
**DNS version detection:**
```shell
nmap --script dns-nsid -p 53 -sU $RHOST
nmap --script dns-service-discovery -p 53 -sU $RHOST
```

### Nmap DNS Scripts

**Default safe scripts:**
```shell
nmap --script "dns-* and safe" -p 53 -sU $RHOST
```

\
**All DNS scripts:**
```shell
nmap --script dns-* -p 53 -sU $RHOST
```

\
**Common enumeration scripts:**
```shell
nmap --script dns-brute,dns-cache-snoop,dns-recursion -p 53 -sU $RHOST
```

\
**Vulnerability detection:**
```shell
nmap --script dns-zone-transfer -p 53 -sU $RHOST
```

### Basic DNS Queries

**Dig:**
```shell
dig @$RHOST example.com A
dig @$RHOST example.com MX
dig @$RHOST example.com NS
dig @$RHOST example.com TXT
dig @$RHOST example.com SOA
dig @$RHOST example.com ANY
dig @$RHOST example.com ANY +noall +answer
```

\
**Nslookup:**
```shell
nslookup example.com $RHOST
nslookup -type=MX example.com $RHOST
nslookup -type=NS example.com $RHOST
```

- **MX** for mail servers
- **NS** nameservers

\
**Host:**
```shell
host example.com $RHOST
host example.com $RHOST -t ANY
```

- `-t ANY` queries all available record types (A, AAAA, MX, NS, TXT, SOA, SRV, CNAME)

\
**Get nameservers:**
```shell
dig @$RHOST example.com NS +short
```

### DNSRecon

Comprehensive DNS enumeration tool:

**Basic enumeration:**
```shell
dnsrecon -d example.com
dnsrecon -d example.com -t std -n $RHOST
```

- `-t std` standard scan type
- `-n` targets specified DNS server to query


---
## Information Gathering

### Subdomain Enumeration

Enumerate subdomains to discover additional attack surface and internal services.

**DNSRecon:**
```shell
dnsrecon -d example.com -D /usr/share/wordlists/dnsmap.txt -t brt
dnsrecon -d example.com -D /usr/share/wordlists/subdomains-top1million-5000.txt -t brt
```

\
**Fierce:**
```shell
fierce -dns example.com
fierce -dns example.com -wordlist /usr/share/wordlists/dnsmap.txt
```

\
**Gobuster (DNS mode):**
```shell
gobuster dns -d example.com -w /usr/share/wordlists/subdomains-top1million-5000.txt
```

\
**Sublist3r:**
```shell
sublist3r -d example.com
sublist3r -d example.com -n -t 100
```

\
**Dnsenum:**
```shell
dnsenum example.com
dnsenum --threads 50 -f /usr/share/wordlists/dnsmap.txt example.com
```

### Record Type Enumeration

Query various DNS record types to gather information about the target infrastructure.

**TXT Records:**
```shell
dig @$RHOST example.com TXT
dig @$RHOST _dmarc.example.com TXT
dig @$RHOST _spf.example.com TXT
```

\
**SPF Records:**
```shell
dig @$RHOST example.com TXT | grep spf
```

\
**Common record types:**
```shell
dig @$RHOST example.com MX       # Mail servers
dig @$RHOST example.com SRV      # Service records
dig @$RHOST example.com CNAME    # Canonical names
dig @$RHOST example.com AAAA     # IPv6 addresses
```

### Reverse DNS Lookups

Discover hostnames from IP ranges:

**Single IP:**
```shell
dig @$RHOST -x 192.168.1.1
host 192.168.1.1 $RHOST
```

\
**IP range:**
```shell
for ip in {1..254}; do dig @$RHOST -x 192.168.1.$ip +short; done
```

### DNS Cache Snooping

Query DNS cache to discover recently queried domains, which can reveal internal services and visited websites.

**Manual cache query:**
```shell
dig @$RHOST nonexistent12345.example.com +norecurse
```

\
If response has NOERROR, the domain is likely cached (queried recently).

**Automated cache snooping:**
```shell
nmap --script dns-cache-snoop --script-args dns-cache-snoop.memcachefile=/usr/share/nmap/nselib/data/dns-srv-names.dat -p 53 -sU $RHOST
```

---
## Vulnerability Assessment

Test for common DNS misconfigurations and vulnerabilities before attempting exploitation.

### Zone Transfer Testing

Zone transfers allow DNS servers to replicate DNS data. Test if zone transfers are allowed without proper restrictions.

**Manual test with dig:**
```shell
dig @$RHOST example.com AXFR
dig @$RHOST -t AXFR example.com
```

\
**Test with nslookup:**
```shell
nslookup
> server $RHOST
> set type=any
> ls -d example.com
```

\
**Test with host:**
```shell
host -T -l example.com $RHOST
```

\
**Test against all nameservers:**
```shell
for ns in $(dig +short NS example.com); do echo "=== $ns ==="; dig @$ns example.com AXFR; done
```

\
**Automated testing:**
```shell
dnsrecon -d example.com -a -n $RHOST
fierce -dns example.com -dnsserver $RHOST
nmap --script dns-zone-transfer --script-args dns-zone-transfer.domain=example.com -p 53 -sU $RHOST
```

>[!warning] **Note**: Successful zone transfers reveal internal network structure, subdomains, and hostnames. Always test if zone transfers are allowed, even if they should be restricted.

### DNS Recursion Testing

Test if DNS server allows recursive queries (should be restricted for public DNS):

**Test recursion:**
```shell
dig @$RHOST www.google.com
```

\
If server resolves external domains, recursion is enabled.

>[!warning] **Note**: Public DNS servers should disable recursion to prevent DNS amplification attacks. Internal DNS servers typically allow recursion.

### Wildcard DNS Detection

Check if wildcard DNS is configured:

**Test random subdomain:**
```shell
dig @$RHOST random12345nonexistent.example.com
```

\
If resolves to same IP, wildcard DNS is enabled.

### DNS Rebinding Testing

Test if DNS server allows rebinding attacks:

**Internal IP resolution:**
```shell
dig @$RHOST internal.example.com
# Check if resolves to private IP (10.x.x.x, 192.168.x.x, 172.16-31.x.x)
```

### DNS Poisoning Testing

Test DNS cache poisoning vulnerabilities:

**Check transaction ID randomness:**
```shell
# Multiple queries and analyze transaction IDs
for i in {1..100}; do dig @$RHOST example.com +short; done
```

---
## Zone Transfer Exploitation

If zone transfers are allowed, exploit them to retrieve all DNS records for a domain.

### Manual Zone Transfer

**Dig:**
```shell
dig @$RHOST example.com AXFR
dig @$RHOST -t AXFR example.com
```

\
**Nslookup:**
```shell
nslookup
> server $RHOST
> set type=any
> ls -d example.com
```

\
**Host:**
```shell
host -T -l example.com $RHOST
```

### Automated Zone Transfer

**DNSRecon:**
```shell
dnsrecon -d example.com -a
dnsrecon -d example.com -a -n $RHOST
```

\
**Fierce:**
```shell
fierce -dns example.com -dnsserver $RHOST
```

\
**Nmap:**
```shell
nmap --script dns-zone-transfer -p 53 -sU $RHOST
nmap --script dns-zone-transfer --script-args dns-zone-transfer.domain=example.com -p 53 -sU $RHOST
```

### Zone Transfer with Nameservers

Attempt zone transfer against all nameservers:

```shell
for ns in $(dig +short NS example.com); do echo "=== $ns ==="; dig @$ns example.com AXFR; done
```

---
## DNS Amplification

Test if DNS server can be used for amplification attacks (enables recursion, responds to ANY queries).

### Check Recursion

**Test recursion:**
```shell
dig @$RHOST www.google.com
```

\
If server resolves external domains, recursion is enabled.

### Check ANY Query Response

**Test ANY queries:**
```shell
dig @$RHOST example.com ANY
```

---
## DNS Tunneling

DNS tunneling can bypass network restrictions by encapsulating data in DNS queries and responses.

### Detection

**Identify suspicious DNS traffic:**
```shell
# High query frequency
tcpdump -i eth0 port 53

# Large DNS responses
# Unusual subdomains
# Queries to known DNS tunnel providers
```

### Common DNS Tunnel Tools

**dns2tcp:**
```shell
# Client
dns2tcp-client -l 8888 -r ssh -z example.com -d 2

# Server
dns2tcpd -f dns2tcpd.conf
```

\
**dnscat2:**
```shell
# Server
dnscat2 --dns domain=example.com

# Client
dnscat2 example.com
```

>[!warning] **Note**: DNS tunneling is often used by malware and can be detected through traffic analysis. It's slow but can bypass traditional firewall rules.

---
## DNS Over HTTPS (DoH) / DNS Over TLS (DoT)

### Detection

**Check for DoH:**
```shell
curl -H "accept: application/dns-json" "https://$RHOST/dns-query?name=example.com&type=A"
```

\
**Check for DoT:**
```shell
nmap -sV -p 853 $RHOST
openssl s_client -connect $RHOST:853
```

### Testing

**DoH query:**
```shell
curl "https://cloudflare-dns.com/dns-query?name=example.com&type=A" -H "accept: application/dns-json"
```

\
**DoT query:**
```shell
dig @$RHOST -p 853 +tls example.com
```

---
## Common Tools

### Dig

Most common DNS query tool:

**Common options:**
```shell
dig @$RHOST example.com +short          # Short output
dig @$RHOST example.com +noall +answer  # Clean output
dig @$RHOST example.com +trace          # Trace DNS resolution
dig @$RHOST example.com +multiline      # Readable format
```

### DNSRecon

Comprehensive DNS enumeration:

**All features:**
```shell
dnsrecon -d example.com -a -s -b -y -k -w -z --threads 50
```
- `-a` zone transfer
- `-s` reverse lookup
- `-b` brute force SRV records
- `-y` brute force PTR records
- `-k` check wildcard
- `-w` whois lookup
- `-z` DNSSEC zone walk

### Dnsenum

DNS enumeration and brute forcing:

**Full scan:**
```shell
dnsenum example.com
dnsenum --threads 50 -f wordlist.txt example.com
```

### Fierce

DNS reconnaissance tool:

**Basic:**
```shell
fierce -dns example.com
fierce -dns example.com -wordlist wordlist.txt -threads 10
```

### Sublist3r

Subdomain enumeration using multiple sources:

```shell
sublist3r -d example.com
sublist3r -d example.com -b -t 100 -e google,yahoo,bing,baidu,ask
```

- `-b` Enables brute-force mode
- `-t` Sets the number of threads for concurrent operations
- `-e` Which search engines to query for subdomain discovery

### MassDNS

High-performance DNS stub resolver:

```shell
# Generate queries
cat subdomains.txt | massdns -r /usr/share/massdns/lists/resolvers.txt -t A -o S -w results.txt
```
