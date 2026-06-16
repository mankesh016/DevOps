# Week 30: Container Orchestration with AWS ECR & ECS

This section covers deploying containerized applications into a highly scalable, serverless AWS environment. We move away from managing individual EC2 instances and raw Auto Scaling Groups, opting instead for AWS's native container orchestration tools.

---

## 🏗️ Architecture Overview

Our deployment pipeline utilizes the following AWS architecture:

1. **Docker CLI:** Used locally to build and tag the application image for the target architecture (`linux/amd64`).
2. **AWS ECR (Elastic Container Registry):** A secure, private repository where our Docker images are stored.
3. **AWS ECS (Elastic Container Service):** The orchestration engine that manages the lifecycle of our containers.
4. **AWS Fargate:** A serverless compute engine integrated with ECS. It abstracts the underlying servers, allowing us to provision compute resources dynamically based purely on the needs of our containers.
5. **Application Load Balancer (ALB):** Routes incoming HTTP/HTTPS traffic to the running ECS Tasks.
6. **AWS ACM (Certificate Manager):** Provisions SSL/TLS certificates to secure our application behind HTTPS on a custom domain.

---

## 🛠️ Deployment Workflow

### 1. Registry & Image Push

First, we authenticate the AWS CLI using a dedicated IAM User with `AmazonEC2ContainerRegistryPowerUser` permissions. The local Docker image is then tagged and pushed directly to our private AWS ECR repository.

### 2. Orchestration Setup (ECS)

ECS requires three structural components to run an application:

- **The Cluster:** We create a Fargate-powered cluster to host our services.
- **The Task Definition:** The blueprint. This links to our ECR Image URL and defines the necessary CPU, memory, and port mappings (e.g., exposing port `3000`).
- **The Service:** This ensures that a specified number of "Tasks" (running containers) are always active and handles replacing any tasks that crash. The Service is tightly coupled with an Application Load Balancer to distribute traffic.

### 3. Networking & Security (Custom Domains & HTTPS)

To make the application production-ready, we secure it with SSL:

1. **Request Certificate:** We request a certificate for our custom domain via AWS ACM.
2. **DNS Verification:** We prove domain ownership by adding a specific AWS-provided `CNAME` record to our DNS provider. _(Note: This record is kept permanently so AWS can handle automatic certificate renewals)._
3. **Traffic Routing:** We add an HTTPS listener (Port 443) to the ALB, attach the ACM certificate, and map a second `CNAME` record to route our custom domain to the ALB's DNS string. Finally, we ensure the Security Group allows inbound traffic on both ports `80` and `443`.

---

## 🔗 Resources & Class Notes

- **[Class 1 Slides: AWS ECR and ECS](https://petal-estimate-4e9.notion.site/AWS-ECR-and-ECS-1b07dfd1073580c8b390ec714d183c3d)**
