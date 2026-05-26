---
# Week 24.2: Cloud Deployment, EC2, and Nginx Reverse Proxies

This section focuses on taking a backend application and deploying it to the cloud using AWS EC2. It covers the fundamentals of server provisioning, environment setup, and utilizing Nginx as a reverse proxy to route traffic professionally.
---

## ☁️ 1. AWS Fundamentals & EC2 Basics

Amazon Web Services (AWS) is the industry standard for cloud computing, used by companies ranging from startups to enterprise giants like OpenAI and Goldman Sachs.

**Core Cloud Services:**

- **Compute (EC2):** Renting Virtual Machines (VMs).
- **Storage & CDN (S3 & CloudFront):** Uploading objects like images, videos, and serving them globally.
- **DNS Management (Route53):** Managing domains and routing.
- **Orchestration (EKS):** Creating and managing Kubernetes clusters.

### EC2 (Elastic Compute Cloud)

EC2 provides scalable computation in the cloud.

- **Public IP vs. Elastic IP:** When you restart an EC2 instance, its standard Public IP changes. An **Elastic IP** is a static IPv4 address designed for dynamic cloud computing that remains permanent across restarts (AWS usually limits you to 5 per region).

---

## 🚀 2. Launching & Provisioning Your First Server

### Step 1: Launching the Instance

- **OS:** Ubuntu (widely used in industry).
- **Size:** `t2.small` or `t3.small` (e.g., 2 vCPUs, 4GB RAM, 100GB SSD).
- **Key Pair:** Generate an RSA `.pem` file. This is your private key; if you lose it, you lose access to the server.
- **Security Groups (Firewall):** By default, AWS blocks all incoming traffic. You must explicitly open ports:
- **Port 22 (SSH):** To access the terminal remotely.
- **Port 80 (HTTP):** For standard web traffic.
- **Port 443 (HTTPS):** For secure web traffic.

### Step 2: Secure Shell (SSH) Access

To connect to your newly provisioned server, use the downloaded `.pem` key.

```bash
# General syntax for Ubuntu instances
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>

```

> **🛡️ Security Error (`0644 - too open`):** > If you get a "Permissions are too open" error, it means your private key file is readable by other users on your local computer. SSH requires private keys to be strictly protected.

> **Fix:** Run `chmod 700 your-key.pem` (or `chmod 400`) to restrict read/write access exclusively to yourself.

### Step 3: Setting Up the Environment (NVM)

Once inside the Ubuntu server, you need to install Node.js to run your backend.
**Do not use `sudo apt-get install nodejs`.** It often installs an outdated version and causes permission issues.

**The Industry Standard: NVM (Node Version Manager)**

```bash
# 1. Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. Restart terminal (or source your profile)
# 3. Install the Long Term Support (LTS) version of Node
nvm install --lts

# Verify installation
node -v  # e.g., v20.x.x
npm -v   # e.g., 8.x.x

```

Once installed, you can `git clone` your backend repository, run `npm install`, and start your server (e.g., `node index.js`).

---

## 🔄 3. The Reverse Proxy (Nginx)

### The "Port 80" Problem

If your domain is `my-website.com`, browsers automatically append Port `80` for HTTP requests (`http://my-website.com:80`).
However, running your Node.js app directly on Port 80 has major issues:

1. **Permissions:** Linux requires root (`sudo`) access to bind to ports below 1024. Running Node as root is a massive security risk.
2. **The Monopolization Issue:** What if you want to host two APIs on the same server?

- `cloths.com` -> `node index.js`
- `shoes.com` -> `node index.js`
  You cannot have two processes listening on Port 80 simultaneously.

### The Solution: Nginx

**Nginx** is a high-performance web server that acts as a **Reverse Proxy**.

- _Forward Proxy (VPN):_ Hides the client from the internet.
- _Reverse Proxy (Nginx):_ Hides the internal servers from the internet.

**Architecture:**
Nginx binds to Port 80 (safely). It intercepts all incoming web traffic, looks at the requested domain name, and acts as a traffic cop, routing the request to the correct internal Node.js process running on a safe, unprivileged port.

- `cloths.com` ➔ **Nginx (Port 80)** ➔ Routes internally to ➔ `localhost:8080`
- `shoes.com` ➔ **Nginx (Port 80)** ➔ Routes internally to ➔ `localhost:8081`

---

## 🛠️ 4. Configuring Nginx and DNS Records

### 1. DNS Records

To connect a custom domain to your EC2 instance, you need to configure your domain provider (like GoDaddy or Namecheap) to point to your server.

- **A Record (Address Record):** Maps a domain name (e.g., `clothsapp.com`) directly to an IPv4 address (e.g., `32.50.1.2`).
- _Note:_ A **CNAME** maps a domain to another domain, while an **A Record** maps to an IP.

### 2. Installing Nginx

```bash
sudo apt update
sudo apt install nginx

# Nginx automatically starts on port 80. To reload after config changes:
sudo nginx -s reload

```

### 3. Nginx Configuration

Configuration files are stored at `/etc/nginx/nginx.conf` (or inside `/etc/nginx/sites-available/`).

- You use `sudo vi /etc/nginx/nginx.conf` to edit the routing rules.
- _Note:_ The syntax is specific to Nginx and uses curly braces and semicolons, not JSON.

By configuring this file, your EC2 machine only needs Port 80 open to the world. Your internal ports (8080, 8081) remain closed off by the AWS Security Group, drastically improving security.

---

## 📅 5. Next Steps & Capstone Tasks

**Upcoming Topics:**

- **Process Management:** Using tools like `pm2` to keep Node.js apps running forever, even if they crash or the server restarts.
- **Certificate Management:** Upgrading HTTP to HTTPS using SSL certificates.
- **CI/CD:** Automating the deployment pipeline.

**Heavy Assignments:**

1. Deploy a React App to an EC2 instance.
2. Obtain a real domain name and map it to an IP.
3. Explore AWS Auto Scaling Groups (ASGs).
4. Recreate the Nginx architecture on Google Cloud Platform (GCP).
