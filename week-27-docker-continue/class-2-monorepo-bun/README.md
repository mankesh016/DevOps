# Week 27.2: End-to-End Monorepo Deployment with Docker, Bun & CI/CD

This week focuses on the practical implementation of deploying a full-stack, monorepo application to Virtual Machines (VMs). We transition from local development to a production-ready CI/CD pipeline, utilizing **Bun** as our high-performance runtime and package manager.

---

## 🏗️ Architecture Overview

The repository is structured as a **Turborepo** monorepo containing multiple microservices that share a common database schema.

### Applications (`/apps`)

1. **`web`**: A Next.js frontend application.
2. **`backend`**: An Express.js REST API.
3. **`ws`**: A WebSocket server utilizing Bun's native, highly optimized WebSocket implementation.

### Packages (`/packages`)

1. **`db`**: A shared Prisma ORM package managing the PostgreSQL database connection and schema. Contains the generated Prisma Client utilized by all applications.

---

## 🚀 Why Bun?

In this deployment, we replaced Node.js and npm with **Bun**.

- **Native TypeScript Execution:** Bun executes `.ts` files natively out of the box, skipping the `tsc` build step for our Express and WebSocket servers.
- **Native WebSockets:** Bun has built-in WebSocket support (`Bun.serve({ websocket: {...} })`), removing the need for external libraries like `ws`.
- **Speed:** Drastically faster package installation and script execution, which significantly speeds up our CI/CD pipeline builds.

---

## 🐳 Containerization Strategy

Instead of a single `Dockerfile`, we mapped our microservices to dedicated build instructions located in the `/docker` directory at the project root:

- `docker/Dockerfile.backend`
- `docker/Dockerfile.frontend`
- `docker/Dockerfile.ws`

Because Bun handles TypeScript natively, our Dockerfiles for the backend and WebSocket server are simplified—we simply copy the source code, run `bun install`, and execute the entry `.ts` files directly.

_Note for Next.js:_ When containerizing Next.js apps that rely on database queries, adding `export const dynamic = "force-dynamic";` to your page routes ensures Next.js doesn't fail attempting to statically generate pages without a live DB connection during the Docker build phase.

---

## 🔄 CI/CD Pipeline (GitHub Actions)

We automated the deployment process using GitHub Actions. The workflow (`.github/workflows/cd-backend.yml`) dictates the continuous delivery lifecycle:

### The 3-Step Deployment Lifecycle

1. **Build Image:** GitHub Actions provisions a runner, checks out the code, and builds the specific Docker image (e.g., the backend server) based on the targeted Dockerfile.
2. **Push to Registry:** The compiled image is tagged and securely pushed to a container registry (**Docker Hub**).
3. **Execute Deployment (SSH):** The runner securely SSHs into the production Virtual Machine, pulls the newly published image from Docker Hub, stops the old container, and spins up the new one.

> **DevOps Concept:** In real-world interviews and architecture, Steps 1 and 2 (Build & Push) are nearly universally identical across companies. Step 3 (Deploy) is the variable component—it changes depending on whether you are deploying to a single VM, triggering an AWS Auto Scaling Group, or rolling out an update to a Kubernetes (K8s) cluster.
> """

with open("README.md", "w", encoding="utf-8") as f:
f.write(content_readme)

print("Files generated: NOTES.md, README.md")

## ⚙️ Automated Deployment with GitHub Actions

To fully automate the deployment of our Dockerized application, we utilize **GitHub Actions** to build a Continuous Deployment (CD) pipeline. The pipeline executes every time code is merged into the main branch, ensuring our Virtual Machine (VM) is always running the latest version of our application without manual intervention.

### The CI/CD Workflow Architecture

Our deployment workflow (`cd-backend.yml`) consists of four primary stages utilizing community-verified GitHub Actions:

1. **Code Checkout (`actions/checkout`):** The pipeline spins up a temporary runner and clones the latest repository code.
2. **Registry Authentication (`docker/login-action`):** To push the built image to Docker Hub, the pipeline authenticates using a Personal Access Token stored securely in GitHub Secrets.
3. **Build & Push (`docker/build-push-action`):** The runner builds the Docker image based on our `Dockerfile`. Upon a successful build, it pushes the image to Docker Hub.
   - **Tagging Strategy:** Images are tagged with both `latest` (for easy reference) and the specific Git commit hash (`${{ github.sha }}`) to ensure strict version control and easy rollbacks.
4. **Remote Execution (`appleboy/ssh-action`):** Finally, the pipeline securely connects to our AWS EC2 instance via SSH. It instructs the VM to pull the newly tagged image from Docker Hub, stop the outdated container, and spin up the new one.

_Infrastructure Note: While Docker Desktop provides a convenient GUI for local development, our cloud VMs run purely on the Docker Engine and CLI to minimize overhead and maximize performance._

## Useful Links

[Class Notes](https://petal-estimate-4e9.notion.site/Deploying-a-monorepo-to-VMs-19c7dfd10735808d9c2ae833fd2f2546)
