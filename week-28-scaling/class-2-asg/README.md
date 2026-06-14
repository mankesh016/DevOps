# Week 28: AWS Infrastructure, Load Balancing & Auto Scaling

This section focuses on the practical implementation of high-availability cloud architecture. Moving beyond single-server deployments, we design robust AWS environments that automatically scale horizontally in response to real-time traffic demands.

---

## 🏗️ Architecture Overview

To achieve true horizontal scaling in AWS, multiple infrastructure components must work in unison.

1. **Amazon Machine Image (AMI):** A custom, baked snapshot of a fully configured EC2 server (containing our OS, Node.js, Bun, and application code).
2. **Launch Template:** The blueprint. It tells AWS to spin up new servers using our custom AMI and execute a specific startup script.
3. **Target Group:** A logical registry of healthy backend servers.
4. **Application Load Balancer (ALB):** The public-facing entry point. It receives all internet traffic and intelligently distributes it across the servers in the Target Group using a Round Robin algorithm.
5. **Auto Scaling Group (ASG):** The brain of the operation. It monitors cloud metrics (like CPU usage) and dynamically adds servers to the Target Group when load is high, and terminates them when traffic subsides.

---

## ⚕️ The Importance of Health Checks

Load Balancers are blind without Health Checks. By configuring the ALB to ping a specific endpoint (e.g., `/health-check`) every few seconds, we ensure traffic is only routed to healthy machines. If a server's Node process crashes, the health check fails. The ALB immediately stops routing traffic to that instance, and the ASG terminates the broken instance and spins up a fresh replacement automatically.

---

## ⚙️ Automated Server Initialization (User Data)

When an ASG creates a new server, no human is there to SSH in and start the application. We handle this using **User Data**—a shell script that runs on initial boot.

**The "Non-Interactive Shell" Problem:**
Because User Data runs as a background initialization script, it does not load user profiles (like `~/.bashrc`). This means global binaries like `npm`, `pm2`, and `bun` will throw a "Command Not Found" error because they aren't in the default `$PATH`.

To fix this, we explicitly define the `$PATH` inside our startup script:

```bash
#!/bin/bash
cd ASG
npm install -g pm2
export PATH=$PATH:/home/ubuntu/.nvm/versions/node/v24.16.0/bin
pm2 start --interpreter /home/ubuntu/.nvm/versions/node/v24.16.0/bin/bun /home/ubuntu/ASG/bin.ts
```

_(Debugging Tip: If a new instance spins up but the app fails to start, SSH into the machine and check the execution logs at `/var/log/cloud-init-output.log`)._

---

## 🔗 Class Slides & Resources

- **[Class 1 Slides: Horizontal and vertical scaling & Indexes in DBs](https://projects.100xdevs.com/tracks/hor-ver-scaling/Horizontal-and-vertical-scaling--Indexes-in-DBs-2)**
- **[Class 2 Slides: Autoscaling groups](https://petal-estimate-4e9.notion.site/Autoscaling-groups-1a27dfd1073580adaaccc785189f156f)**
