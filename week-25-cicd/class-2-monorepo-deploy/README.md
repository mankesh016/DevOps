# Week 25.2: CI/CD, Certificate Management, and Monorepo Deployment

This week bridges the gap between writing code and maintaining it in a production environment. We transition from local development into deploying complex monorepos, managing multiple deployment environments, automating updates via CI/CD, and securing applications with SSL certificates.

---

## 🏗️ 1. Deployment Environments & Architecture

In professional software engineering, code is never pushed directly to the end-users. It moves through a pipeline of isolated environments to ensure stability.

### The Standard Tiered Architecture

1. **Development (`dev.app.com`):** An isolated, internal environment where developers test new features. It uses dummy data and is completely detached from the production database.
2. **Staging (`staging.app.com`):** A "pre-production" environment. It mirrors the exact server specs and infrastructure of the live app. Quality Assurance (QA) engineers and SDETs run final load tests and integration tests here.
3. **Production (`app.com`):** The live environment handling real users and real data.

**Why isolate?** If developers run a massive database migration or a heavy load-test in the `dev` environment, it should never consume resources or cause downtime on the `production` servers. Isolation prevents catastrophic cascading failures.

---

## 📦 2. Monorepo Deployment Strategy

Deploying a monorepo (e.g., using Turborepo) is fundamentally different from deploying a single Express app. A full-stack monorepo might contain:

- A Next.js Web App
- An Express HTTP Server
- A Node.js WebSocket (WS) Server
- A shared Prisma Database package

**The Strategy:**
Instead of deploying these to separate repositories, the single monorepo is cloned onto the production server. We then utilize a **Process Manager** to start multiple, distinct background processes from that single codebase.

### Process Management (PM2)

When you close your SSH terminal, standard terminal processes die. We use **PM2**, an industry-standard daemon process manager, to keep applications alive in the background. PM2 ensures high availability by automatically restarting the HTTP or WS servers if they crash due to a runtime error.

---

## 🔄 3. Continuous Integration & Continuous Deployment (CI/CD)

Manually SSH-ing into a server to run `git pull`, `npm build`, and `pm2 restart` is prone to human error and poses a severe security risk. Modern teams use CI/CD pipelines (like GitHub Actions) to automate this.

### Continuous Integration (CI)

The practice of frequently merging code changes into a central repository.

- **The Goal:** Catch bugs early.
- **The Mechanism:** When a developer opens a Pull Request, the CI pipeline automatically runs linters, unit tests, and end-to-end (E2E) tests. If any test fails, the system blocks the merge.

### Continuous Deployment (CD)

The practice of automatically deploying code once it passes all CI checks.

- **The Workflow:** 1. Code is merged into the `main` branch.

2. GitHub Actions spins up a secure, temporary runner.
3. The runner securely connects to your EC2/Production server via SSH.
4. The runner executes the deployment script (`pull`, `build`, `restart`).

---

## 🔐 4. Certificate Management (HTTPS)

Serving applications over HTTP is insecure; data is transmitted in plain text. **HTTPS** encrypts this data using SSL/TLS certificates.

### Let's Encrypt & Certbot

We use **Certbot**, a tool provided by the Let's Encrypt organization, to automatically provision and install free SSL certificates on our Nginx reverse proxy.

**The Lifecycle of a Certificate:**

- SSL certificates provided by Let's Encrypt expire every **90 days**.
- **DevOps Best Practice:** You should never manually renew these. Instead, you set up an automated script (a Cron job or systemd timer) that runs `certbot renew` periodically to check for expiring certificates and seamlessly update them without downtime.

---

## 🧠 5. Common DevOps Pitfalls & Interview Concepts

When setting up automated SSH deployments (like GitHub Actions), you will likely run into two classic Linux/DevOps hurdles:

### The "Failed Host Verification" Problem

When a machine connects to a new server via SSH for the very first time, Linux prompts the user to verify the server's cryptographic fingerprint. Because GitHub Actions is an automated bot, it cannot type "yes" to this prompt, causing the pipeline to hang and fail.

- **The Fix:** Pass a flag instructing SSH to skip this check (`StrictHostKeyChecking=no`).

### The "Command Not Found" Problem (`Interactive` vs. `Non-Interactive` Shells)

If you log into your server manually, commands like `npm` or `pm2` work perfectly. But if GitHub Actions runs the exact same commands, it throws `Command Not Found`.

- **The Theory:** When a human logs in, Linux opens an **Interactive Shell**, which loads profile files (like `~/.bashrc`) that configure the `$PATH` variable, telling the system where programs live. Automated SSH scripts open a **Non-Interactive Shell** to save time, skipping those profile configurations.
- **The Fix:** In CI/CD scripts, you must explicitly declare the `$PATH` or use absolute file paths to your executables.
