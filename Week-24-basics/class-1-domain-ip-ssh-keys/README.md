---
# Week 24.1: Networking Fundamentals, Infrastructure, and SSH

This section covers the foundational concepts of how machines communicate over networks, the hardware virtualization that powers modern cloud computing, and the cryptographic protocols used to securely access remote servers.
---

## 🌐 1. Networking Basics: IPs, Domains, and Local Routing

Computers use IP addresses; humans use Domains. The Domain Name System (DNS) bridges the gap.

### The Loopback: Localhost

- **`localhost`** is a domain that loops back directly to your current machine.
- Standard IPv4 address: **`127.0.0.1`**
- **Verification:** Running `ping localhost` resolves to `127.0.0.1`, while `ping google.com` resolves to a public IP (e.g., `142.250.199.14`).

### IP Addressing: IPv4 vs. IPv6

| Feature          | Details                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| **IPv4**         | 32-bit addresses composed of 4 octets (e.g., `132.11.22.133`, `0.0.0.0`). Max value per octet is 255. |
| **IPv4 Limits**  | Total capacity is `256^4` (approx. 4.3 billion). Cloud providers "rent" these out.                    |
| **Invalid IPv4** | `1000.500.200.300` (Exceeds the 255 limit per block).                                                 |
| **IPv6**         | 128-bit addresses created to solve IPv4 exhaustion. Uses hexadecimal notation.                        |

### Local Network Routing (Intranet)

Your home router acts as a gateway, assigning **Private IP Addresses** (usually `192.168.x.x`) to connected devices (Mac, Windows, Phone).

- **Mild Hosting:** If you run an Express server (`node index.js`) on port 3000, you can access it from your phone by navigating to your computer's private IP (e.g., `http://192.168.1.4:3000`), provided both are on the same Wi-Fi network.

### Finding Your IP & Network Security

On your Laptop, you can inspect your network interfaces using the terminal:

- Run **`ifconfig`**:
- `lo0`: Loopback interface (`127.0.0.1`).
- `en0`: Your Wi-Fi interface (shows your private network IP, e.g., `192.168.1.4`).

> **⚠️ Security Warning (`npx serve`):**
> When you run `npx serve`, it exposes your app on your local network. Anyone on the same Wi-Fi can run a port scan to find open ports. Never expose sensitive development environments on public Wi-Fi (like cafes) because your traffic is visible to the entire local network.

---

## 🗺️ 2. The Local DNS: `/etc/hosts`

Before querying a global DNS server, your operating system checks its local `/etc/hosts` file. You can manually edit this file to route domains to specific IPs.

- **File Location:** `sudo vi /etc/hosts`
- **Common Entries:**

```text
127.0.0.1 localhost
255.255.255.255 broadcasthost

```

- **Testing:** You can point a domain you own to localhost to test it before global DNS propagation completes (`127.0.0.1 123.vercel.app`).
- **Spoofing / Phishing:** Editing this file to point `codeforces.com` to Google's IP is a classic local prank. In a malicious context, this is how local phishing works: routing a legit URL (`instagram.com`) to a fake, attacker-controlled IP.

> **💡 Note:** Do not leave prank entries in this file. You will inevitably forget, and later wonder why your Codeforces submissions aren't loading!

---

## ☁️ 3. Infrastructure: Cloud vs. Self-Hosting

When deploying an app, you have several infrastructure choices, primarily boiling down to **Cloud (Renting)** vs. **Self-Hosting (Owning)**.

### The Virtual Machine (VM) and the Hypervisor

When you rent a server on AWS (EC2) or DigitalOcean (Droplet), you are usually renting a **Virtual Machine**, not a physical computer.

**What is a Hypervisor?**
A hypervisor (or Virtual Machine Monitor) is software that creates and runs VMs. It sits on top of physical hardware and divides the resources (CPU, RAM, Storage) into isolated virtual environments.

- **Type 1 (Bare Metal):** Runs directly on the physical hardware. This is what massive data centers (AWS, GCP) use to securely host thousands of VMs.
- **Type 2 (Hosted):** Runs on top of a standard OS (like VirtualBox running on your Mac).

### Virtual Machine vs. Bare Metal

| Architecture        | Description                                                                      | Best Use Case                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Bare Metal**      | A physical server entirely dedicated to a single tenant. No hypervisor overhead. | High-frequency trading (e.g., servers located physically near a Japan Exchange for zero latency), or Bitcoin mining.  |
| **Virtual Machine** | An isolated environment sharing physical hardware via a hypervisor.              | Standard web apps, microservices, or building isolated code execution environments (like a LeetCode or Replit clone). |

---

## 🔐 4. SSH Protocol & Authentication

**SSH (Secure Shell)** is a cryptographic network protocol operating on port `22`. It gives you secure, terminal-level access to a remote machine over an unsecured network. _(Context: Unlike FTP for files or SMTP for email, SSH is for secure command execution)._

### Setting up a Remote Machine

1. Create an account on a cloud provider (AWS EC2, DigitalOcean).
2. Choose a machine size (e.g., $8/mo for 1GB RAM, 1 CPU).
3. The provider spins up a VM and assigns it a **Public IP**.
4. You connect to it: `ssh root@139.59.x.x`

### Asymmetric Cryptography: Public & Private Keys

Password authentication is vulnerable to brute-force attacks. Modern servers use Asymmetric Cryptography (Key Pairs).

**How Asymmetric Encryption Works:**
You generate a mathematically linked pair of keys. What one key encrypts, _only the other key can decrypt_.

1. **Private Key:** Stays entirely secret on your local machine (`~/.ssh/id_rsa` or `~/.ssh/id_ed25519`).
2. **Public Key:** Shared openly. Placed on the remote server inside the `~/.ssh/authorized_keys` file.

**The Cryptographic Proof:**

- **Authentication (Proving who you are):** You encrypt a random message with your _Private Key_. The server uses your _Public Key_ to decrypt it. If it decrypts successfully, the server knows mathematically that the message could only have come from the holder of the private key.
- **Encryption (Keeping data secret):** The server encrypts data using your _Public Key_. Only you (holding the _Private Key_) can decrypt and read it.

### Generating Keys

- Run `ssh-keygen` in your terminal. (Modern standard is Ed25519, which is faster and more secure than RSA).
- Never share your private key. If someone gets access to your laptop's private key, they have root access to all your cloud servers.

### The `known_hosts` File

When you connect to a server for the first time, SSH saves its cryptographic fingerprint in your `~/.ssh/known_hosts` file. If a hacker intercepts your connection later (Man-in-the-Middle or DNS hijack) and routes you to a fake server, the fingerprint won't match, and your terminal will throw a massive security warning, preventing the connection.
