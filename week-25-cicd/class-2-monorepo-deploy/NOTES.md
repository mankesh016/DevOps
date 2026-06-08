# NOTES.md: Week 25.2

## Continued CI/CD & Certificate Management

_(Class Duration: 3:30 Hrs)_

### Agenda

1. **Deploying a Monorepo:** Handling `http-server`, `ws-server`, `prisma`, and a Postgres database.
2. **Environment Variables:** How to handle environment variables upon deployment.
3. **Environments:** Dev vs. Prod environments (and why merging to the `master` branch immediately deploying might break the code).
4. **Testing in CI Pipelines:** Writing tests so that if tests fail, Pull Requests are blocked.
5. **Certificate Management:** Utilizing HTTPS using Certbot or buying paid certificates.
6. **CD Pipeline (Certificates):** Refreshing certificates every 1 to 3 months.
7. **CD Pipeline (Database):** Copying the prod database to the dev database daily.
8. **Deployment Considerations:** How to deploy projects involving databases, where to keep environment variables, and how to update them.

---

## 1. Creating a Monorepo Locally (Web Dev Concept)

_Note: This specific setup process is more of a pure Web Dev concept and may not be strictly relevant to DevOps, but it is necessary context._

Whenever starting a new project, it is always a good idea to initialize the monorepo, deploy it to a cluster, and write the entire CI/CD pipeline _first_ before starting the application logic.

### Step 1: Initialize the Monorepo

```bash
npx create-turbo@latest ./

```

_(Note: You can use `npm`, `pnpm`, `yarn`, or `bun`. It's generally recommended to stick with `npm` or `pnpm`, as `bun` can make life harder in CI/CD pipelines during deployment)._

- **Clean up:** Delete the extra `docs` Next.js app.

### Step 2: Database & Prisma Setup (`packages/prisma`)

Create a `prisma` folder inside `packages/` and initialize it:

```bash
npm init -y

```

- Rename the package in `package.json` to `"@repo/db"`.
- Remove the default scripts.
- Initialize TypeScript:

```bash
npx tsc --init

```

- Add to `devDependencies` in `package.json`: `"@repo/typescript-config": "workspace:*"`
- Install Prisma:

```bash
pnpm add prisma

```

- **Define Schema (`schema.prisma`):**

```prisma
model User {
  id       String @id @default(uuid())
  username String @unique
  password String
}

```

- Put the database connection string (from NeonDB) into your `.env` file.
- Run migrations and generate the client:

```bash
npx prisma migrate dev --name init
npx prisma generate

```

_(Note from class: If the Prisma client generation didn't work smoothly, a fallback used in class was to clone the starter code repository, reset to a specific commit, and rebuild)._

```bash
git clone <repo-url>
git log --reverse --oneline
git reset --hard <your-copied-commit-hash>
pnpm i        # Install globally
pnpm build    # Build globally
npm run dev   # Run the web Next app to test if it fetches users from DB

```

### Step 3: Server Setup (`http-server` and `ws-server`)

For both the HTTP and WebSocket servers, follow these steps:

```bash
npm init -y
npx tsc --init

```

Update `package.json` with standard scripts and dependencies:

```json
"scripts": {
  "build": "tsc -b",
  "start": "node dist/index.js",
  "dev": "npm run build && node dist/index.js"
},
"devDependencies": {
  "@repo/typescript-config": "workspace:*"
}

```

Update `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  }
}
```

#### HTTP Server Logic

```bash
pnpm add express @types/express
pnpm install # run globally to reflect dependencies

```

Write the Express logic in `src/index.ts`:

```typescript
import express from "express";
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HelloWorld");
});

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
```

_Port allocations:_

- Next.js Web App runs on `3000`
- HTTP Server runs on `3001`
- WS Server runs on `3002`

#### WebSocket Server Logic

```bash
pnpm add ws @types/ws

```

Write the WebSocket logic in `src/index.ts`:

```typescript
import { WebSocketServer } from "ws";
import client from "@repo/db/client";

const server = new WebSocketServer({ port: 3002 });

server.on("connection", async (socket) => {
  await client.user.create({
    data: {
      username: `user-${Math.random().toString()}`,
      password: `pass-${Math.random().toString()}`,
    },
  });
  console.log("User created");
  socket.send("hello");
});
```

---

## 2. Deployment Architecture (Environments)

Large companies do not operate solely on a `main` branch. If a junior engineer pushes directly to a `main` branch connected to auto-deployment, it could easily break production.

### Standard Environments:

1. **Dev (`dev.app.com`):** A closed environment where developers test code (no real users).
2. **Staging (`staging.app.com`):** A closed environment identical to production. Software Development Engineers in Test (SDETs) / QA engineers test the application here.
3. **Production (`app.com`):** Public-facing environment for real users.

_Important Note:_ You _can_ do everything in a single server droplet. However, production servers should never be affected by development testing (like load testing). Therefore, these environments should be strictly separated, ideally across different Kubernetes clusters or separate VMs.

**Branch Strategy Example:**

```bash
git checkout -b production
git push origin HEAD

```

---

## 3. Manual Monorepo Deployment (AWS EC2)

_Disclaimer: Generally, no developer should SSH into production machines. SSH access should be closed, and you should use remote login or view logs externally. However, we are doing it today for educational purposes._

### Tasks for Manual Deployment:

1. **Create 2 servers** on AWS EC2. (Vercel abstracts this but charges heavily. Azure offers instances with no card required).
2. **Add Node, Nginx** to both servers.
3. **Clone the monorepo** to both servers.
4. **Start 3 processes** (Next.js, WS, HTTP).
5. **Point domain names** to the respective servers (e.g., `http.100xdevs.com`, `ws.100xdevs.com`, `fe.100xdevs.com`, and staging equivalents).
6. **Refresh Nginx config.**
7. **Test** that everything is working.

### Server Setup via SSH:

Generate keys and log in to the EC2 instances:

```bash
# Generate key locally if needed
ssh-keygen # e.g., id_rsa-aws

# SSH into the machine
ssh -i ~/.ssh/id_aws ubuntu@<ip-address>

```

Install the required software (NVM, Node, Nginx, PNPM):

```bash
# Install NVM and Node
curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash
source ~/.bashrc
nvm install --lts

# Install Nginx
sudo apt update
sudo apt install nginx

# Install PNPM
npm install -g pnpm

```

Clone the repository and build:
_(Make sure the repo is public on GitHub, or use deployment keys if private)._

```bash
git clone <repo-http-url>
cd test-deployment
pnpm install

```

Configure Database on the Server:

```bash
cd packages/prisma
vi .env # Add: DATABASE_URL="neon..."
npx prisma migrate dev --name init

```

### Process Management with PM2

`pm2` and `forever` are libraries that keep processes running. If a process fails, the library restarts it.

```bash
npm install -g pm2

# Start processes using npm/pnpm through pm2
pm2 start npm --name "process-name" -- start
pm2 list

# Starting the whole monorepo dev command as an example
pm2 start pnpm --name "http-ws-fe" -- run dev

```

### Nginx Configuration

Update your Nginx configuration files:

```bash
sudo vi /etc/nginx/nginx.conf
# Paste routing config here
sudo nginx -t
sudo nginx -s reload

```

---

## 4. CI/CD & GitHub Actions

Once manual deployment is complete, we automate it using CI/CD pipelines via GitHub Actions.
You can enforce **Branch Protection Rules** on the `main`/`production` branches:

- Require signed commits.
- Require PR reviews (history never changes).
- Block force pushes.

### Pipeline Structure

Create a `.github/workflows/` folder at the root level containing:

- `cd-prod.yml`
- `cd-staging.yml`
- `e2e.yml` (End-to-End testing)

### Automating the Deployment Steps

Manually, deploying an update looks like this:

```bash
cd testmonorepo-deploy
git pull
pnpm run build
pm2 restart --name http-ws-fe

```

In a CI/CD pipeline, you script these actions using GitHub Actions, connecting via SSH using secrets stored in GitHub (`secrets.SSH_KEY`).

### Common GitHub Actions Errors & Solutions

**ERROR 1: Failed Host Verification**

- **Cause:** When a remote machine connects via SSH for the very first time, it checks the server's fingerprint against its `known_hosts` file. Since it's a new, temporary GitHub runner, the fingerprint isn't found, and the runner hangs waiting for a "yes/no" prompt.
- **Solution:** Bypass this prompt by passing the StrictHostKeyChecking flag:

```bash
ssh -o StrictHostKeyChecking=no -i <secret-key> ubuntu@<ip-address>

```

**ERROR 2: `pnpm` or `pm2` Command Not Found**

- **Cause:** When you log into a server manually via an interactive shell, Linux automatically loads your profile (`~/.bashrc` or `~/.zshrc`), which sets up your `$PATH` variable so the OS knows where Node, PNPM, and PM2 are installed. However, GitHub Actions connects via a **non-interactive shell**, which skips loading the profile to save time. The server temporarily forgets where these executables are located.
- **Solution:** You must either run `echo $PATH` and explicitly set the environment variable path in your script, or use absolute paths to run the binaries.

---

## 5. Certificate Management (HTTPS)

We use **Certbot** (from Let's Encrypt) to generate free SSL certificates for HTTPS.

### Installation

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

```

### Generating Certificates

Apply certificates to your specific subdomains:

```bash
sudo certbot --nginx -d fe.aftercp.com -d http.aftercp.com -d ws.aftercp.com

```

### Reload and Test Renewal

```bash
sudo nginx -t
sudo systemctl reload nginx

# Test the auto-renewal process (certificates expire every 90 days)
sudo certbot renew --dry-run

```
