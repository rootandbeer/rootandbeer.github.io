---
title: "BLE / Bluetooth Low Energy"
date: 2026-02-25T19:55:48-08:00
draft: false
description: "BLE and Bluetooth Low Energy penetration testing guide covering device discovery, GATT enumeration, security mode assessment, traffic capture with Sniffle, and exploitation techniques for IoT devices, smart locks, wearables, and BLE-enabled systems."
noindex: false
featured: false
pinned: false
toc: true
nav_weight: 1
series:
#  -
categories:
#  -
tags:
  - sniffle
  - wireshark
  - gatttool
  - bluetoothctl
images:
#  -
meta:
  reading_time: false
  date: false
---

{{< doc_vars "BMAC,HANDLE=0x0025,VALUE=0100" >}}

BLE (Bluetooth Low Energy) is used in IoT devices, smart locks, wearables, beacons, and mobile peripherals. BLE pentesting aligns with PTES (Intelligence Gathering → Vulnerability Analysis → Exploitation) and OWASP IoT Security Testing Guide (ISTG-WRLS) categories: authorization, information disclosure, cryptography, and input validation. Common findings include weak pairing ("Just Works"), unencrypted GATT characteristics, replay attacks, and MITM opportunities when encryption is absent or downgraded.



## Discovery

Discover BLE devices advertising in range. Ensure the Bluetooth adapter is powered on and scanning.

### Adapter Setup

**Check adapter status:**
```shell
hciconfig
hciconfig hci0 up
```

>[!important] Change `hci0` to your adapter if multiple exist (`hciconfig -a`).

### Scanning for Devices

**hcitool (Classic + LE):**
```shell
sudo hcitool lescan
sudo hcitool scan
```

- `lescan` — BLE devices only (continuous; Ctrl+C to stop)
- `scan` — Classic Bluetooth inquiry

\
**bluetoothctl (interactive):**
```shell
bluetoothctl
power on
scan on
# Wait for devices; note MAC addresses
scan off
devices
```

\
**bleah (Python, BLE-focused):**
```shell
sudo bleah -e
```

### Reconnaissance

Use a dedicated sniffer (e.g., Sniffle, Ubertooth) to capture advertisements without connecting. Advertisements may reveal device names, service UUIDs, manufacturer data, and TX power.

---

## Enumeration

Enumerate GATT services, characteristics, and descriptors to understand device functionality and identify read/write/notify targets.

### bluetoothctl (Preferred on Modern Linux)

**Connect and discover services:**
```shell
bluetoothctl
connect $BMAC
# BlueZ auto-discovers GATT; list appears after connection
menu gatt
list-attributes
# Navigate services/characteristics
select-attribute <UUID>
read
# Or: notify on / notify off
```

### gatttool (Legacy, Still Useful)

**Interactive mode:**
```shell
gatttool -b $BMAC -I
connect
# If connection fails, try:
connect -t random
# Or:
connect -t public
```

\
**Primary services:**
```shell
gatttool -b $BMAC -t random --primary
```

\
**Characteristics:**
```shell
gatttool -b $BMAC -t random --characteristics
```

\
**Read/Write (non-interactive):**
```shell
gatttool -b $BMAC -t random --char-read -a <HANDLE>
gatttool -b $BMAC -t random --char-write-req -a <HANDLE> -n <HEX_VALUE>
gatttool -b $BMAC -t random --char-write-cmd -a <HANDLE> -n <HEX_VALUE>
```

- `--char-write-req` — write with response (reliable)
- `--char-write-cmd` — write without response (unreliable)

>[!important] Use `-t random` for BLE Random Static Address or `-t public` for Public Address. Many BLE devices use random addresses.

### GATT Structure Overview

| Layer        | Purpose                                              |
|-------------|------------------------------------------------------|
| Service     | Logical grouping of characteristics (UUID)           |
| Characteristic | Data value (read/write/notify); has UUID and handle |
| Descriptor  | Metadata (e.g., Client Characteristic Configuration) |

**Common service UUIDs (16-bit):**
- `0x1800` — Generic Access (device name, appearance)
- `0x180a` — Device Information (manufacturer, model, firmware)
- `0x180f` — Battery Service
- `0xffe0` — Common custom/vendor service

---

## Information Gathering

### Device Information Service

Read Device Name, Manufacturer, Model, Firmware, and Serial from the Device Information service when present:

```shell
gatttool -b $BMAC -t random --char-read -a 0x000c
# Or enumerate handles first and read relevant characteristics
```

### Advertising Data

Capture and parse advertising packets for:
- Device name
- Service UUIDs (complete/incomplete list)
- Manufacturer-specific data
- TX power, flags

---

## Traffic Capture (Sniffle)

Traffic capture is required before security assessment. Set up a sniffer and capture the pairing sequence when a legitimate client connects. Sniffle provides reliable BLE sniffing with advertising channel hopping. Hardware: [Sonoff Zigbee 3.0 USB Dongle Plus (CC26x2/CC1352)](https://sonoff.tech/en-us/products/sonoff-zigbee-3-0-usb-dongle-plus-zbdongle-p) flashed with [NCC Group's Sniffle firmware](https://github.com/nccgroup/Sniffle).

### Firmware Installation

```shell
pushd /opt/sniffle/
wget https://github.com/nccgroup/Sniffle/releases/download/v1.10.0/sniffle_cc1352p1_cc2652p1_1M.hex
git clone https://github.com/sultanqasim/cc2538-bsl.git
cd cc2538-bsl
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install pyserial intelhex
python3 cc2538-bsl.py -p /dev/ttyUSB0 --bootloader-sonoff-usb -ewv ../sniffle_cc1352p1_cc2652p1_1M.hex
deactivate
popd
```

### Sniffle & Wireshark Extcap

```shell
if [ ! -d /opt/sniffle/Sniffle-1.10.0/python_cli ]; then
  echo "[+] - Sniffle not installed! Installing at 1.10.0..."
  sudo mkdir -p /opt/sniffle
  sudo chown -R $USER:$USER /opt/sniffle
  pushd /opt/sniffle
  wget https://github.com/nccgroup/Sniffle/archive/refs/tags/v1.10.0.tar.gz
  tar xvf v1.10.0.tar.gz
  mkdir -p $HOME/.local/lib/wireshark/extcap
  ln -s /opt/sniffle/Sniffle-1.10.0/python_cli/sniffle_extcap.py $HOME/.local/lib/wireshark/extcap
  sudo mkdir -p /root/.local/lib/wireshark/extcap
  sudo ln -s /opt/sniffle/Sniffle-1.10.0/python_cli/sniffle_extcap.py /root/.local/lib/wireshark/extcap
  popd
else
  echo "[+] - Sniffle already installed at 1.10.0"
fi
```

### Wireshark Display Filters

**Write Requests/Commands (replay targets):**
```shell
_ws.col.info contains "Sent Write Request" || _ws.col.info contains "Sent Write Command"
```

**Older Wireshark (opcode filter):**
```shell
btatt.opcode == 0x12 || btatt.opcode == 0x52
```

- Write commands are in `Bluetooth Attribute Protocol`
- Capture `Handle` and `Value` for replay

---

## Security Assessment (Vulnerability Analysis)

Analyze captured traffic to assess pairing behavior, encryption, and key distribution. Use the Sniffle capture from the previous section.

### Determine Security Mode & Encryption

Pairing and encryption are visible in captured traffic. Open the capture in Wireshark and locate the pairing sequence (scroll near the moment the client first connected).

**Wireshark filter:**
```shell
btatt || btsmp || btle
```

**Narrow by device:**
```shell
(btatt || btsmp || btle) &&
(btle.advertising_address == $BMAC || btle.initiator_address == $BMAC)
```

**Locate pairing:**
- `Bluetooth Security Manager Protocol` → `Pairing Request` / `Pairing Response`
- Expand to view: `IO Capability`, `Authentication Requirements`, `Initiator Key Distribution`, `Responder Key Distribution`

**Security mode reference:**

| Value | Meaning                   | Security               |
| ----- | ------------------------- | ---------------------- |
| 0x00  | Just Works                | ❌ weak (MITM possible) |
| 0x01  | Bonding only              | ❌ weak                 |
| 0x05  | MITM protection           | ✔ passkey              |
| 0x09  | LE Secure Connections     | ✔✔ strong              |
| 0x0D  | Secure Connections + MITM | 🔒 strongest           |

**Encryption start (confirm encryption is used):**
```shell
btle.ll_control.opcode == 0x03
# or
btle.ctrl.opcode == 3
# or (newer Wireshark)
btle && frame contains "ENC"
```

**Confirm encryption sequence:**
- `LL_ENC_REQ`
- `LL_ENC_RSP`
- `LL_START_ENC_REQ` — encryption starts here

### Pairing Method Testing

Test which pairing method the device uses. Per OWASP IoT and industry checklists, evaluate:

| Method             | MITM Resistance | Typical Use              |
|--------------------|-----------------|--------------------------|
| Just Works         | ❌ None         | Headless, no display     |
| Numeric Comparison | ✔ Yes           | Both devices have display|
| Passkey Entry      | ✔ Yes           | One device has keyboard  |
| Out-of-Band (OOB)  | ✔ Yes           | NFC, QR, etc.            |

Document whether the device supports encryption downgrade (e.g., accepting Legacy Pairing when LE Secure Connections is available).

### Known Vulnerabilities

Check for known BLE stack and SDK vulnerabilities before exploitation:

- **SweynTooth** — 17+ CVEs across TI, NXP, Cypress, Dialog, Espressif, Zephyr, etc. (deadlocks, crashes, security bypass). See [Asset Group disclosure](https://asset-group.github.io/disclosures/sweyntooth/).
- **CVE databases** — Search device manufacturer, chipset, and firmware version for BLE-related CVEs.
- **Vendor advisories** — Check Bluetooth SIG and chip vendor security bulletins.

---

## Exploitation

### GATT Read/Write Replay

After capturing a valid write from a legitimate client (e.g., phone app), replay it with gatttool:

```shell
gatttool --char-write-req --handle=$HANDLE --value=$VALUE -b $BMAC -t random
```

Use `-t public` instead of `-t random` if the device uses a public address.

**Value format:**
- Hexadecimal, no spaces (e.g., `0100` for 0x01 0x00)
- Or use `-n` with hex string

**Example:**
```shell
gatttool -b 8a:5b:aa:ff:f5:55 -t random --char-write-req -a 0x0025 -n 0100
```

### Unauthenticated GATT Access

If the device does not enforce pairing for sensitive characteristics:
1. Connect with bluetoothctl or gatttool
2. Read/write characteristics without bonding
3. Document which handles expose sensitive data or control

### Replay Attacks

Devices that accept commands without sequence numbers or nonces may be vulnerable to replay:
1. Capture valid write commands during normal operation
2. Replay the same handle/value at a later time
3. Test for unlock, configuration change, or other state change

### MITM (Man-in-the-Middle)

When pairing uses "Just Works" (no MITM protection):
- Use tools such as Gattacker or Flipper Zero to sit between initiator and peripheral
- Capture or modify pairing/connection traffic
- Document impact (e.g., key extraction, session hijacking)

---
