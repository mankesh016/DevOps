---
# Week 25.1: Process Management (PM2) & CI/CD Fundamentals

This week transitions from manual server provisioning to making those servers resilient and automated. We cover how to keep Node.js applications alive indefinitely using PM2, and introduce the foundational concepts of Continuous Integration and Continuous Deployment (CI/CD) using GitHub Actions.
---

## ⚙️ 1. Process Management: The Problem with `node app.js`

When you SSH into an EC2 instance and run `node app.js`, the server runs and listens on your specified port (e.g., 3000). However, this is **not suitable for production** because:

1. If the app crashes due to an error, it stays dead.
2. If you close your SSH terminal session, the process terminates.
3. Node.js is single-threaded; running a single instance doesn't fully utilize a multi-core CPU.

### The Solution: PM2 (Process Manager 2)

PM2 is an industry-standard daemon process manager for Node.js. It acts like `nodemon`, but is designed specifically for production environments.

**Key Features of PM2:**

- **Daemonization:** Keeps apps running in the background continuously.
- **Auto-Restart:** Automatically restarts crashed apps.
- **Monitoring:** Provides real-time logging and metric monitoring.
- **Cluster Mode:** Supports running multiple instances of the same app across multiple CPU cores for better performance.

---

## 🛠️ 2. Setting Up & Managing Processes

### Initial Server Setup (Ubuntu)

```bash
sudo apt update
sudo apt install nodejs npm
# Verify installations
node -v
npm -v

```

_(Pro-Tip: AWS offers a Startup program where you can apply for up to $10,000 in free credits to host infrastructure)._

### Installing and Running PM2

```bash
# Install PM2 globally
sudo npm i -g pm2

# Start your application
pm2 start app.js

```

### Essential PM2 Commands

| Command                  | Description                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `pm2 status` or `pm2 ls` | Lists all running processes with metrics (ID, Name, Mode, Restarts, CPU%, Memory). |
| `pm2 stop <id/name>`     | Stops the process (e.g., `pm2 stop 0` or `pm2 stop index`).                        |
| `pm2 restart <id/name>`  | Restarts the specified process.                                                    |
| `pm2 delete <id/name>`   | Removes the process from PM2's management list entirely.                           |
| `pm2 examples`           | Displays a helpful list of all available PM2 commands.                             |

---

## 🕵️ 3. Manual Process Hunting (`lsof` & `kill`)

Sometimes ports get stuck, or you need to manually intervene at the OS level to free up a port.

**Finding what is running on a port:**
Use `lsof` (List Open Files). In Linux, everything (including a network connection) is treated as a file.

```bash
lsof -i :3000

```

**Output Example:** `COMMAND: node | PID: 8119 | USER: ubuntu | TYPE: IPv6 | NODE: TCP | NAME: *:3000 (LISTEN)`

**Killing the Process:**
Once you have the **PID (Process ID)**, you can terminate it.

```bash
kill 8119

```

> **🧠 Interview Prep Question:** _What happens if you manually `kill` a process that is being managed by PM2?_
> **Answer:** PM2's daemon is watching that process. The moment the OS kills it, PM2 instantly spins up a new instance of the app. If you run `lsof -i :3000` again, you will see the app is back online but with a **brand new PID**. To actually stop the app, you must tell PM2 to stop it (`pm2 stop <id>`).

---

## 🔄 4. CI/CD (Continuous Integration & Deployment)

In modern software development, you rarely push code directly to a production server manually. You use a pipeline.

### The Environments

1. **Dev:** Where developers test their unpolished code.
2. **Stage (Staging):** An exact replica of production used for final QA testing.
3. **Prod (Production):** The live app used by real customers.

### CI: Continuous Integration

CI is the process of automating the integration of code changes from multiple contributors into a single software project.

- **When it runs:** Triggered immediately when someone pushes code to the `main` branch or opens a Pull Request.
- **What it does:** \* Builds the project.
- Runs Unit & Integration tests.
- Checks for **Lint / Formatting** (Crucial in open-source to ensure tabs vs. spaces or formatting rules are unified across hundreds of contributors).

### CD: Continuous Deployment / Delivery

CD is the process of automatically deploying the successfully integrated code to the targeted environment (Dev, Stage, or Prod).

---

## 🐙 5. GitHub Actions

GitHub Actions is a CI/CD platform integrated directly into GitHub. It uses YAML files to define workflows.

- **Configuration Location:** Workflows must be placed in the `.github/workflows/` directory (e.g., `test.yml`, `deploy.yml`).
- **Key Action:** `actions/checkout@v2` (or v3/v4). This is a pre-built step that automatically runs `git clone` on your repository inside the GitHub runner, pulling your code in so it can be tested or built.

```yaml
# Basic example of a workflow file location
.github/
└── workflows/
    ├── test.yml     # Runs CI (Linting, Testing)
    └── deploy.yml   # Runs CD (Deployment)

```

---
