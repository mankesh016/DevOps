# NOTES.md: Week 28 - Class 2

## Horizontal Scaling, Load Balancers & Auto Scaling Groups (ASGs)

### 1. The Architecture of Scale

This class covers the practical implementation of horizontal scaling using AWS infrastructure.

- **The Goal:** Build an architecture where user traffic hits a Load Balancer (LB), which then distributes the requests across multiple identical backend servers.
- **Kubernetes:** While AWS offers ASGs, moving towards Kubernetes (K8s) is generally a better and more configurable way to scale applications under heavy load.
- **Cloud Provider Terminology:** Every cloud provider is "enterprise-heavy" and uses its own specific terminology.
  - AWS: Auto Scaling Groups (ASG).
  - Google Cloud (GCP): Managed Instance Groups (MIG).

### 2. AWS Components for Horizontal Scaling

To create an Auto Scaling Group in AWS, you must understand several underlying components:

- **EC2:** The base virtual machines.
- **AMI (Amazon Machine Image):** A pre-configured template used to launch virtual servers. It contains the operating system, installed application software, and specific settings.
- **Launch Templates:** The configuration blueprint specifying which AMI, instance type, and startup scripts to use when spinning up new servers.
- **Target Groups:** A logical grouping of EC2 instances that a Load Balancer routes traffic to.
- **Load Balancers:** Distributes incoming traffic across the instances in a Target Group.

### 3. Step-by-Step Setup Process

#### Step A: Preparing the Base EC2 Instance

First, create a single EC2 instance and configure it manually.

1. Install `nvm` and `node`.
2. Install `bun` globally: `npm install -g bun`.
3. Install `pm2`: `npm install -g pm2`.
4. Clone your repository and run `bun install`.
5. Find the exact path of the Bun binary using `which bun`.
6. Start the process using PM2 with the Bun interpreter:
   `pm2 start --interpreter /home/ubuntu/.nvm/versions/node/v24.16.0/bin/bun bin.ts`
7. Check logs: `pm2 logs`.

#### Step B: Creating the AMI

Once the base EC2 instance is perfectly configured, navigate to `Actions -> Image and templates -> Create Image` to bake it into an AMI.

#### Step C: Creating the Launch Template & User Data

In AWS EC2, go to `Instances -> Create Launch Template`. Under "Advanced details," you add a **User Data** script. This script runs automatically whenever the ASG spins up a new instance from your AMI.

**The "Command Not Found" Problem:**
When a script runs automatically at startup (non-interactive shell), files like `~/.bashrc` are NOT sourced. The system will not know where `node`, `pm2`, or `bun` are installed because they aren't in the default `$PATH`.
_Solution:_ Explicitly export the PATH inside the script.

_User Data Startup Script:_

```bash
#!/bin/bash
cd ASG
npm install -g pm2
export PATH=$PATH:/home/ubuntu/.nvm/versions/node/v24.16.0/bin
pm2 start --interpreter /home/ubuntu/.nvm/versions/node/v24.16.0/bin/bun /home/ubuntu/ASG/bin.ts

```

_(Debugging Note: If the script fails, you can check the logs inside the newly created instance at `/var/log/cloud-init-output.log`)_.

#### Step D: Target Groups and Health Checks

Create a Target Group to hold your instances.

- **Health Checks:** This is highly recommended, especially for ASGs. You configure an endpoint (e.g., `/health-check` or the root `/`). If the server responds with a 200 OK, the Load Balancer routes traffic to it. If the app crashes and returns a 500 (or times out), the Load Balancer stops sending requests to that specific machine and the ASG will terminate and replace it.

#### Step E: Load Balancers (ALB vs. NLB)

Attach the Target Group to a Load Balancer.

- **Application Load Balancer (ALB):** Operates at a higher level (Layer 7). Routes HTTP/HTTPS traffic.
- **Network Load Balancer (NLB):** Operates at a lower level (Layer 4). Used for pure TCP, UDP, or TLS traffic.

#### Step F: Auto Scaling Policies

Finally, configure the ASG with Min, Max, and Desired capacity limits (e.g., Min: 1, Max: 5).

- **Time-based/Scheduled Scaling:** Scale up between 8 AM - 11:59 PM, scale down at night.
- **Dynamic/Predictive Scaling:** Scale based on metrics like Average CPU utilization, Network I/O, or ALB Request Count per target.
