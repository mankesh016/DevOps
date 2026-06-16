# NOTES.md: Week 30 - Class 1

## AWS ECR and ECS (Container Orchestration)

This class focuses on deploying containerized applications to a serverless environment on AWS using ECS, as well as managing container images using ECR.

### 1. Key AWS Container Services

- **ECR (Elastic Container Registry):** AWS's alternative to Docker Hub. It allows you to store, manage, and deploy Docker container images. Key features include private repositories, seamless integration with ECS/EKS for faster pulls, and fully managed scalability.
- **ECS (Elastic Container Service):** A fully managed container orchestration service for running Docker containers. It handles cluster management, task definitions (blueprints), and service management (automatically replacing failed containers).
- **EKS (Elastic Kubernetes Service):** AWS's managed Kubernetes service for running containerized applications using Kubernetes.
- **Fargate:** A serverless compute engine for containers that works with both ECS and EKS. It removes the need to provision and manage underlying EC2 servers.

#### ECS vs. ASG & Lambda vs. Fargate

- **Serverless Concept:** Serverless does not mean there is no server; it means you don't manage the underlying server instances—AWS handles the infrastructure for your code.
- **Lambda vs. Fargate:** AWS Lambda is for running short-lived functions, whereas AWS Fargate is for running long-running containers.
- **ASG vs. ECS:** Auto Scaling Groups (ASG) let you deploy raw applications (like a Node.js or Rust app directly on an OS), whereas ECS specifically deploys containers (and can deploy them to Fargate).

### 2. Core ECS Terminology

While ECS terminology shares similarities with Kubernetes, there are differences:

- **Cluster:** A logical grouping of resources used by ECS to manage and run containerized applications (e.g., an EC2 cluster or a Fargate serverless cluster).
- **Task Definition:** The blueprint that describes which Docker container image to use, port mappings, etc..
- **Task:** A running instance of a containerized application (closer to a "Pod" in K8s).
- **Service:** A high-level abstraction on top of tasks that ensures the desired number of tasks are always running (very close to a "Deployment" in K8s).

---

### 3. Step-by-Step Implementation

#### Step A: Containerize the Application Locally

1. Create a simple Express application (e.g., using Bun).
2. Write a `Dockerfile`.
3. Build the Docker image explicitly for the target architecture:
   `docker build --platform=linux/amd64 -t node-app .`
4. Test locally using `docker run -p 3000:3000 node-app`.

#### Step B: Push Image to ECR

1. Navigate to the AWS Console, search for **ECR**, and create a new private registry.
2. Create an **IAM User** specifically for pushing/pulling images and attach the `AmazonEC2ContainerRegistryPowerUser` permission policy.
3. Generate an Access Key and Secret Key for this IAM user, and configure your local terminal using `aws configure`.
4. Open your ECR repository, click **"View push commands"**, and execute those commands in your terminal to tag and push the image to AWS.

#### Step C: Deploy via ECS

1. **Create a Cluster:** Go to ECS and create a new cluster (using AWS Fargate for a serverless architecture).
2. **Create a Task Definition:** Define the blueprint. Provide the ECR Image URL and configure the port mappings (e.g., port 3000).
3. **Create a Service:** Inside the cluster, create a service. Select your Task Definition family, choose Fargate as the capacity provider strategy, define the number of replicas, and attach an Application Load Balancer (ALB).

#### Step D: Load Balancer & Security Group Configuration

1. Go to the EC2 Dashboard -> Load Balancers.
2. Ensure the ALB has an `HTTP: 80` listener.
3. Ensure the attached Security Group allows inbound traffic on port 80 from anywhere.
4. Copy the ALB's DNS name and paste it into your browser to verify it works (e.g., you see "Hello World").

#### Step E: HTTPS and Custom Domain Setup (AWS ACM)

1. In the Load Balancer settings, add an **HTTPS: 443** listener and forward it to your target group.
2. In the security policies for the listener, request a new certificate via **AWS ACM (Certificate Manager)**.
3. Enter your full custom domain (e.g., `node-app.aftercp.com`).
4. **Domain Verification:** AWS requires proof of ownership. Add the provided `CNAME` name and value to your DNS registry (e.g., Cloudflare/GoDaddy). The status will change from "Pending" to "Verified", and the certificate will be issued.
5. **Attach Certificate & Route Traffic:**
   - Attach the generated certificate to the Load Balancer HTTPS listener.
   - Ensure your Security Group allows inbound traffic on port `443` from anywhere.
   - Add a _second_ `CNAME` record in your DNS registry mapping your custom domain (`node-app.aftercp.com`) to the Load Balancer's DNS name.
6. **Important Note:** Do not delete the initial verification CNAME record after verification. AWS uses this same entry to automatically renew your certificate in the future.
