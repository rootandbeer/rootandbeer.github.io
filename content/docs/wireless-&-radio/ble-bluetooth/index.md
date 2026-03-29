---
title: "BLE / Bluetooth Low Energy"
date: 2026-02-25T19:55:48-08:00
draft: false
description: "BLE and Bluetooth Low Energy penetration testing guide covering scoped methodology, discovery, Sniffle traffic capture, GATT enumeration, pairing and encryption analysis, and exploitation techniques for IoT devices, smart locks, wearables, and BLE-enabled systems."
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

### Methodology workflow

Follow a consistent order so you do not miss pairing traffic or scope:

1. **Passive discovery** — Scan and parse advertisements; optionally sniff advertising channels without connecting to map names, UUIDs, and manufacturer data.
2. **Link-layer capture (when in scope)** — Start the sniffer *before* the events you need to analyze. For **SMP/pairing and encryption**, capture while the legitimate user (or you) bonds for the first time. For **GATT command replay**, capture during normal app-driven use. You can iterate after enumeration if you need targeted ATT writes.
3. **Active enumeration** — Connect and map GATT services, characteristics, and descriptors; fingerprint firmware and capabilities from standard services.
4. **Security analysis** — Interpret pairing, IO capabilities, AuthReq flags, encryption start, bonding behavior, and known stack/CVE issues against sensitive handles.
5. **Exploitation and reporting** — Replay, unauthorized access, MITM where applicable; document impact, affected handles, and remediation.

The sections below follow this flow: Discovery → Traffic capture → Enumeration → Security assessment → Exploitation.

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

Use a dedicated sniffer (e.g., Sniffle, Ubertooth) to capture advertisements without connecting. Parse advertising payloads for:

- Device name (complete or shortened)
- Service UUIDs (complete or incomplete list)
- Manufacturer-specific data (company ID + payload)
- Flags, TX power, and appearance hints

---

## Traffic capture (Sniffle)

Traffic capture supports security analysis; timing matters more than tool choice. **For pairing and key distribution**, begin recording before the first bond or reconnect that establishes keys. **For application-layer testing**, capture while the official client drives the peripheral so write opcodes and handles match real use. Enumeration below does not replace capture—it tells you which handles matter once you have a PCAP.

Sniffle provides reliable BLE sniffing with advertising channel hopping. Hardware: [Sonoff Zigbee 3.0 USB Dongle Plus (CC26x2/CC1352)](https://sonoff.tech/en-us/products/sonoff-zigbee-3-0-usb-dongle-plus-zbdongle-p) flashed with [NCC Group's Sniffle firmware](https://github.com/nccgroup/Sniffle). Make sure the device is the CC26x2/CC1352 chipset.

>[!tip] Pair With nRF52840
>Using this alongside with the [nRF52840](#nordic-nrf52840-readwrite-replay) makes for a highly capable setup.

Scripts complementary to [Pentest Partners](https://www.pentestpartners.com/security-blog/start-hacking-bluetooth-low-energy-today-part-2/) (BLE series).

### Firmware installation

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

### Sniffle & Wireshark extcap

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

### Wireshark display filters

**Write requests/commands (replay targets):**
```shell
_ws.col.info contains "Sent Write Request" || _ws.col.info contains "Sent Write Command"
```

**Older Wireshark (opcode filter):**
```shell
btatt.opcode == 0x12 || btatt.opcode == 0x52
```

- Write commands are in `Bluetooth Attribute Protocol`
- Capture `Handle` and `Value` for replay

Replay the capture writes using an [nRF52840](#nordic-nrf52840-readwrite-replay)

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

### Device Information Service

Read device name, manufacturer, model, firmware revision, and serial number from the Device Information service (`0x180a`) when present. Handles vary by firmware; enumerate GATT first, then read characteristics under that service.

```shell
gatttool -b $BMAC -t random --char-read -a 0x000c
# Or enumerate handles first and read relevant characteristics under 0x180a
```

---

## Security Assessment (Vulnerability Analysis)

Analyze PCAPs from passive or Sniffle capture to assess pairing behavior, encryption, and key distribution, alongside what you observed during live enumeration.

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

**Interpret SMP fields (do not equate AuthReq hex with “pairing method”):**

- **Pairing method** (Just Works, Numeric Comparison, Passkey Entry, OOB) is chosen from **both** devices’ **IO Capability** values (e.g., `NoInputNoOutput` on both sides often yields Just Works). It is not a single “security mode” byte.
- **Authentication Requirements** (`AuthReq`) is a bitmask on the same PDU: bonding intent, **MITM** (authenticated pairing required), **LE Secure Connections (SC)** vs legacy short-term key path, and related flags. Decode the expanded fields in Wireshark rather than memorizing one magic byte.
- **Stronger posture** usually means SC enabled, MITM required when the IO model supports it, and bonding only where key storage is appropriate. **Weaker posture** often shows no MITM flag, no SC, or a downgrade to legacy pairing when SC is available.

Example `AuthReq` patterns (illustrative; always confirm in Wireshark): `0x01` bonding without MITM/SC; `0x05` bonding and MITM; `0x09` bonding and SC; `0x0d` bonding, MITM, and SC.

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

- **SweynTooth** — Multiple CVEs across TI, NXP, Cypress, Dialog, Espressif, Zephyr, etc. (deadlocks, crashes, security bypass). See [Asset Group disclosure](https://asset-group.github.io/disclosures/sweyntooth/).
- **BrakTooth** — Classic and BR/EDR-focused stack flaws; still relevant when the product exposes dual-mode stacks or shared controllers. See [Asset Group BrakTooth](https://asset-group.github.io/disclosures/braktooth/).
- **CVE databases** — Search device manufacturer, chipset, and firmware version for BLE-related CVEs.
- **Vendor advisories** — Check Bluetooth SIG and chip vendor security bulletins.

---

## Exploitation

### Nordic nRF52840 read/write replay

>[!warning] Recommended Method
>Replay `writes` captured by [Sonoff/Sniffle](#traffic-capture-sniffle) dongle 

Using an [nRF52840](https://store.aprbrother.com/product/usb-dongle-nrf52840) USB dongle flashed with [April Brother `ble_connectivity` firmware](https://github.com/AprilBrother/april-usb-dongle-52840/tree/main/firmware) supports scripted or host-driven connection tests and replay-style workflows alongside captures.

Download the [nRF Connect for Desktop](https://www.nordicsemi.com/Products/Development-tools/nrf-connect-for-desktop/download) application from Nordic to use the dongle and replay writes.

### GATT Read/Write Replay

After capturing a valid write from a legitimate client (e.g., phone app), replay it with `gatttool` using the attribute handle and hex payload from the PCAP:

```shell
gatttool -b $BMAC -t random --char-write-req -a $HANDLE -n $VALUE
```

Use `-t public` instead of `-t random` if the device uses a public address. Set `HANDLE` in hex (e.g., `0x0025`); set `VALUE` as a contiguous hex string with no spaces (e.g., `0100` for bytes `0x01 0x00`).

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
