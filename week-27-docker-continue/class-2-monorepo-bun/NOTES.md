# NOTES.md: Week 27.2

## Week 27 (Class 2): Implementation Stream

**Topic:** Deploying a Monorepo Using Docker to VMs via CI/CD.

In this class, we deployed a full end-to-end project using CI/CD to Virtual Machines (VMs).
**Key Tooling Shift:** We used **Bun** as our runtime and package manager instead of Node.js/npm.

### Context & Roadmap

1. Create a monorepo locally and add a Database package.
2. Add a backend (Express), WebSocket (ws) server, and Next.js routes.
3. Update the Next.js package to use the DB.
4. Write the Dockerfiles for all 3 services.
5. Create a `docker-compose.yml`.
6. Write the CI/CD pipeline that pushes the built images to Docker Hub.
7. Create a VM where you pull and redeploy the image via SSH.

---

### Step 1: Monorepo & Database Setup

Initialize the monorepo using Bun and Turborepo:

````

```text
Files generated: NOTES.md, README.md

```bash
npm install -g bun
npx create-turbo@latest ./

````

Setup the Database package:

```bash
cd packages
mkdir db && cd db
bun init

```

Update `dependencies` in `package.json` manually with specific versions (e.g., `"prisma": "5.20.0"`, `"@prisma/client": "5.22.0"`).

Initialize Prisma:

```bash
bun install
bunx prisma init

```

**Schema (`schema.prisma`):**

```prisma
model User {
  id       Int     @id @default(autoincrement())
  username String  @unique
  password String
  todos    Todo[]
}

model Todo {
  id        Int     @id @default(autoincrement())
  title     String
  completed Boolean @default(false)
  user_id   Int
  user      User    @relation(fields: [user_id], references: [id])
}

```

Start Postgres via Docker and Migrate:

```bash
docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres

# .env: DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres"

bunx prisma migrate dev
bunx prisma generate

```

Export the Prisma client (`packages/db/index.ts`):

```typescript
import { PrismaClient } from "@prisma/client";
export const prisma = new PrismaClient();
```

Ensure `package.json` has:

```json
"exports": {
  "./client": "./index.ts"
}

```

---

### Step 2: Backend and WebSocket Setup

Ensure `DATABASE_URL` is available wherever the Prisma client runs.

**1. Express Backend (`apps/backend`)**

```bash
bun init
bun install express @types/express

```

Add `"db": "*"` to dependencies.
Write standard Express code in `index.ts`.

**2. WebSocket Server (`apps/ws`)**

```bash
bun init

```

Add `"db": "*"` to dependencies.
_Note: Bun natively has a WebSocket library, so we do not need an external `ws` package like we do in Node.js._

WebSocket Logic in Bun (`index.ts`):

```typescript
import { prisma } from "@repo/db";

Bun.serve({
  port: 8081,
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    async message(ws, message) {
      await prisma.user.create({
        data: {
          username: Math.random().toString(),
          password: Math.random().toString(),
        },
      });
      ws.send(message); // echo the same message
    },
  },
});
```

---

### Step 3: Modifying the Next.js App

1. Add the `"@repo/db"` dependency to `apps/web`.
2. Write landing page code to fetch and show all users.
3. _Crucial for Docker builds with Next.js:_ Add `export const dynamic = "force-dynamic";` to the top of your `page.tsx` to prevent Next.js from failing at build time due to missing dynamic DB connections.

---

### Step 4: Containerizing the Application

Create a `/docker` folder at the root level and create 3 specific files inside it:

- `Dockerfile.backend`
- `Dockerfile.frontend`
- `Dockerfile.ws`

_Advantage of Bun:_ Since we are using Bun, we do not strictly need to build/transpile TypeScript first. Bun can directly run `.ts` files.

**Global Scripts (`package.json` at root):**

```json
"scripts": {
  "db:generate": "cd ./packages/db && bunx prisma generate",
  "start:backend": "cd ./apps/backend && bun run index.ts",
  "start:frontend": "cd ./apps/web && bun run start",
  "start:ws": "cd ./apps/ws && bun run index.ts"
}

```

---

### Step 5: CI/CD Pipeline Deployment

Create a GitHub Action workflow: `.github/workflows/cd-backend.yml`.

**The Workflow Pipeline:**

1. **Build** the Docker image.
2. **Push** the Docker image to Docker Hub.
3. **Deploy:** SSH into the VM, pull the latest image, and start the new container.

_DevOps Interview Insight:_
You will often be given a bunch of files and asked to write the Dockerfile and CI/CD pipeline to deploy it.

- Steps 1 & 2 (Build & Push to Docker Hub) remain the same.
- Step 3 (Deployment) changes based on the target infrastructure (e.g., standard VMs, Autoscaling Groups, Kubernetes cluster).

### VM Setup (AWS EC2)

To deploy the containerized application, you must first log in to your Virtual Machine (AWS EC2 instance) via SSH and install Docker and Docker Compose.

```bash
# Example SSH command to access the VM
ssh -i ~/.ssh/id_aws ubuntu@13.60.31.133
```

_Note: When you install Docker Desktop locally, it bundles the Docker CLI, Docker Engine, Docker GUI, and Docker Compose. However, on a headless VM, you do not need the Docker GUI; you only install the Engine, CLI, and Compose plugins._

### The Manual Deployment Flow (On the VM)

Once SSH'd into the VM, the deployment steps are straightforward:

1. Pull the latest image from Docker Hub.
2. If the old container is already running, **stop** and **remove** it.
3. Run the new image and assign it a name.
   _(And that's it!)_

### Automating via GitHub Actions (`.github/workflows/cd-backend.yml`)

Instead of doing the above manually, we automate it using a CI/CD pipeline. Here are the core steps and the pre-built Actions used:

**1. Checkout Code Action**

- **Uses:** `actions/checkout@v4`
- _Purpose:_ Pulls your repository code into the GitHub Actions runner.

**2. Login to Docker Hub**

- **Uses:** `docker/login-action@v3`
- _Purpose:_ Authenticates the runner to push images to Docker Hub.
- _Setup:_ You will need your Docker Hub username and an Access Token (easily generated from Docker Hub settings—ensure permissions are correct). Store these securely in **GitHub Secrets**.

**3. Build and Push Image**

- **Uses:** `docker/build-push-action@v5`
- _Purpose:_ Builds the Docker image and pushes it to your registry.
- _Configuration:_ You must provide this action with the context and the location of your `Dockerfile`. Set `push: true`.
- _Tagging:_ You must provide tags for the image. It is common practice to provide two tags: the specific commit hash (`${{ github.sha }}`) for traceability, and `latest`.

**4. SSH into VM**

- **Uses:** `appleboy/ssh-action@v1`
- _Purpose:_ Securely connects to your AWS VM to execute the final deployment commands (pulling the newly pushed image and running it).

## Useful Links

[Class Notes](https://petal-estimate-4e9.notion.site/Deploying-a-monorepo-to-VMs-19c7dfd10735808d9c2ae833fd2f2546)
