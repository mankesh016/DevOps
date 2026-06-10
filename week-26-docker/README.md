# Week 26: Docker & Containerization

This section marks our transition into modern infrastructure. We explore **Docker**, the industry standard for containerization, which solves the infamous _"it works on my machine"_ problem. We cover the lifecycle of containers, writing and optimizing Dockerfiles, and orchestrating communication between isolated microservices.

---

## 🐳 1. The Core Philosophy: Why Docker?

Before Docker (introduced ~2013), running a complex application locally meant installing the correct version of Node.js, setting up a local PostgreSQL database, configuring Redis, and hoping your Operating System (Mac, Windows, Linux) didn't cause environment-specific bugs.

**Containers solve this by providing:**

1. **Isolated Environments:** Applications run in tightly controlled, isolated bubbles.
2. **Standardization:** A container behaves exactly the same on a developer's Macbook as it does on an AWS production server.
3. **Effortless Auxiliary Services:** Need a MongoDB database? Instead of installing it on your host machine, you simply spin up a Mongo container in seconds.
4. **The Foundation for Orchestration:** Containers are the atomic unit of modern deployment, laying the groundwork for Kubernetes (K8s).

### Images vs. Containers _(Interview Concept)_

- **Image:** The blueprint. A lightweight, standalone, and executable package that includes everything needed to run a piece of software (code, runtime, system tools, libraries). _Images are immutable (they don't change)._
- **Container:** The execution. When an image is actively running, it becomes a container.

---

## 🛠️ 2. Containerizing an Application (The Dockerfile)

To containerize a Node.js application, we define its environment in a `Dockerfile`. Docker builds images in **layers**, where each instruction (`COPY`, `RUN`) represents a new layer.

### The Naive Approach (Unoptimized)

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Copy ALL files (code + package.json)
COPY . .

# Run expensive install
RUN npm install

EXPOSE 3000
CMD ["node", "dist/index.js"]

```

**The Problem:** Docker aggressively caches layers to speed up builds. In the naive approach, modifying _even a single line of application code_ invalidates the cache for the `COPY . .` step. This forces Docker to re-run `npm install` on every single build, drastically slowing down development.

### The Professional Approach (Layer Caching)

```dockerfile
FROM node:20-alpine
WORKDIR /app

# 1. Copy ONLY dependency metadata first
COPY package.json package-lock.json ./

# 2. Run the expensive install operation
RUN npm install

# 3. Copy the rest of the application code
COPY . .

EXPOSE 3000
CMD ["node", "dist/index.js"]

```

**Why this is better:** Now, if you change your application logic, the cache for Step 1 remains valid (since `package.json` didn't change). Docker will use the cached `node_modules` from Step 2 and instantly skip to Step 3. **This reduces build times from minutes to milliseconds.**

---

## 💾 3. Volumes (Data Persistence)

**The Problem:** By default, containers are ephemeral (temporary). If you run a MongoDB container, insert data, and then stop the container, **the internal file system is destroyed, and your data is gone forever.**

**The Solution:** Use **Volumes**. Volumes allow you to mount a persistent folder from your host machine into the container.

```bash
# 1. Create a persistent volume
docker volume create mongo_db_data

# 2. Run MongoDB and mount the volume to Mongo's internal data directory
docker run -p 27017:27017 -v mongo_db_data:/data/db --name my-mongo mongo

```

_Even if the `my-mongo` container is destroyed, the database records survive safely inside the `mongo_db_data` volume._

---

## 🕸️ 4. Docker Networks (Microservice Communication)

If you have an isolated Node.js container and an isolated MongoDB container, they cannot talk to each other by default. They must be placed on the same **Docker Network**.

### Step-by-Step Connection:

**1. Create a custom network:**

```bash
docker network create node_app_network

```

**2. Start the Database on the network:**

```bash
docker run -p 27017:27017 -v mongo_db_data:/data/db --name mongodb-container --network node_app_network mongo

```

**3. Update your Application Code:**
Instead of connecting to `localhost`, your Node app must now connect using the database's **container name**.

```javascript
// Old: mongoose.connect("mongodb://localhost:27017/myDB");
// New: mongoose.connect("mongodb://mongodb-container:27017/myDB");
```

**4. Start the Application on the network:**

```bash
docker build -t my-node-app .
docker run -p 3000:3000 --name node-container --network node_app_network my-node-app

```

_Your Node.js container will now successfully resolve `mongodb-container` and connect to the database!_

---

## 🖥️ 5. Essential Docker Commands Cheat Sheet

| Action                      | Command                                                   |
| --------------------------- | --------------------------------------------------------- |
| **Build an Image**          | `docker build -t <image_name> .`                          |
| **List Images**             | `docker images`                                           |
| **Run a Container**         | `docker run -p <host_port>:<container_port> <image_name>` |
| **List Running Containers** | `docker ps`                                               |
| **Stop a Container**        | `docker kill <container_id>`                              |
| **Access Terminal**         | `docker exec -it <container_id> sh` _(or `/bin/bash`)_    |
| **Push to Docker Hub**      | `docker push <username>/<image_name>`                     |

### Default Ports Reference

_When port mapping (`-p HOST:CONTAINER`), knowing the default internal ports is crucial:_

- **Databases:** PostgreSQL (`5432`), MongoDB (`27017`), Redis (`6379`), MySQL (`3306`)
- **Web Servers:** Nginx (`80`, `443`)
- **Monitoring:** Grafana (`3000`), Prometheus (`9090`)
- **App Runtimes:** Node/Express (`3000`)
