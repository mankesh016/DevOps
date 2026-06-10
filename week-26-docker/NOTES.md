# NOTES.md: Week 26 (Docker & Containerization)

## Week 26.1: Introduction to Docker

### Why Docker?

A few years ago, technologies like Docker and Kubernetes didn't even exist (Docker was introduced around 2013). Today, they are ubiquitous. Docker and containers are essential for several reasons:

1. **Kubernetes & Container Orchestration:** Docker is the most popular container runtime (though a "container" is a broader concept not strictly limited to Docker).
2. **Isolated Environments:** Docker allows you to run processes in completely isolated environments. It is much more lightweight than running full Virtual Machines (VMs).
3. **Running Auxiliary Services:** It makes spinning up local databases (Redis, Postgres, MongoDB) incredibly easy without polluting your host machine.
4. **Standardization:** Developers have different Operating Systems (Mac, Windows, Linux), and the steps to run a project vary based on the OS. Tracking dependencies as a project grows is extremely hard. Docker solves the classic _"it works on my machine"_ problem.

### Benefits of Using Containers

- Describe your entire environment configuration in a single file (`Dockerfile`).
- Run applications in isolated environments.
- Makes local setup of complex OS projects a breeze.
- Makes installing databases and auxiliary services effortless.

### Core Concepts: Images vs. Containers

- **Image:** A lightweight, standalone, executable package that includes everything needed to run a piece of software (code, runtime, system tools, libraries, and settings).
- **Container:** An image in execution is called a container.

---

### Port Mapping

When running a container, its internal network is isolated. You must map a port from your host machine (e.g., your Mac) to the container's internal port.

- Example: Mapping Mac port `27017` to MongoDB container port `27017`.

### Default Ports Cheat Sheet

It is helpful to memorize common default ports:

| Category           | Service                   | Default Port(s)     |
| :----------------- | :------------------------ | :------------------ |
| **Databases**      | MySQL / MariaDB           | 3306                |
|                    | PostgreSQL                | 5432                |
|                    | MongoDB                   | 27017               |
|                    | Redis                     | 6379                |
|                    | ElasticSearch             | 9200, 9300          |
|                    | Cassandra                 | 9042                |
|                    | CouchDB                   | 5984                |
| **Web Servers**    | Nginx                     | 80, 443             |
|                    | Apache / httpd            | 80, 443             |
| **App Servers**    | Node.js (Express default) | 3000                |
|                    | Python (Flask default)    | 5000                |
|                    | Tomcat / Jetty            | 8080                |
| **Monitoring**     | Grafana                   | 3000                |
|                    | Prometheus                | 9090                |
|                    | Kibana                    | 5601                |
|                    | Logstash                  | 5044, 9600          |
| **CI/CD & Tools**  | Jenkins                   | 8080, 50000         |
|                    | GitLab                    | 80, 443, 22         |
|                    | SonarQube                 | 9000                |
| **Misc / Brokers** | RabbitMQ                  | 5672 (15672 for UI) |
|                    | Kafka                     | 9092                |
|                    | Zookeeper                 | 2181                |

---

### Essential Docker Commands

```bash
docker run -p 5432:5432 postgres            # Run a container with port mapping
docker ps                                   # List running containers
docker kill <container_id>                  # Stop/kill a container
docker images                               # List all local images
docker build -t <image_name> .              # Build an image from a Dockerfile in current dir
docker login                                # Authenticate with Docker Hub
docker push <username>/<image_name>         # Push an image to a registry
```

**Executing Commands Inside a Container:**

```bash
# Gives interactive terminal access to a running container
docker exec -it <container_id> sh   # Use 'sh' for Alpine images, '/bin/bash' for others

```

---

### Containerizing a Node.js Application (Interview Question)

To containerize an application, you create a `Dockerfile` at the root level of your project.

**Basic Dockerfile:**

```dockerfile
# 1. Base Image (alpine versions are extremely lightweight)
FROM node:16-alpine

# 2. Working Directory inside the container
WORKDIR /app

# 3. Copy files from host to container
COPY . .

# 4. Run commands to build the image
RUN npm install
RUN npm run build

# 5. Expose ports (Documentation purpose, actual exposure happens during 'docker run')
EXPOSE 3000

# 6. Final Command that runs when the container STARTS
CMD ["node", "dist/index.js"]

```

**Building and Running:**

```bash
docker build -t hello-node-app .
docker run -p 3000:3000 hello-node-app

```

**Handling Environment Variables:**
You usually shouldn't hardcode `ENV` variables in the `Dockerfile` for security reasons. Pass them during runtime:

```bash
docker run -p 3000:3000 -e DATABASE_URL="mongodb://xyz" image-name

```

---

## Week 26.2: Docker Part 2 (Optimization, Volumes, Networks)

### 1. Optimizing the Dockerfile (Layer Caching)

Docker builds images in **layers**. Each command (`FROM`, `WORKDIR`, `COPY`, `RUN`) creates a new layer. Docker aggressively caches these layers to speed up future builds.

**The Problem with the Basic Approach:**
If you use `COPY . .` and then `RUN npm install`, modifying even a single line of application code invalidates the cache for the `COPY` step. Because the cache is busted, the subsequent `npm install` (which is a very expensive and slow operation) runs every single time.

**The Solution (Layer Caching Strategy):**
Copy _only_ the `package.json` files first, run `npm install`, and _then_ copy the rest of the source code. This way, `npm install` uses the cached layer unless the dependencies themselves change.

**Optimized Dockerfile:**

```dockerfile
FROM node:22-alpine
WORKDIR /app

# Copy only package metadata first
COPY package.json package-lock.json ./

# Run expensive install operation
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 3000
CMD ["node", "index.js"]

```

---

### 2. Volumes (Data Persistence)

When you stop and remove a Docker container, its internal file system is lost. If you run MongoDB inside a container and add data, that data is gone forever when the container is deleted.

**Volumes** allow data to persist somewhere on your host machine outside the core container state.

**Using Volumes:**

```bash
# 1. Create a fresh volume
docker volume create mongo_db_data

# 2. Check existing volumes
docker volume ls

# 3. Run MongoDB and attach the volume to Mongo's default data path
docker run -p 27017:27017 -v mongo_db_data:/data/db mongo

```

---

### 3. Docker Networks (Container Communication)

How do you make an isolated Node.js container talk to an isolated MongoDB container? You put them on the same **Docker Network**.

**Step-by-Step Networking:**

```bash
# 1. Create a custom network
docker network create node_app_network

# 2. Run the MongoDB container on this network (give it a specific --name)
docker run -p 27017:27017 -v mongo_db_data:/data/db --name mongodb-c --network node_app_network mongo

```

**Updating Application Code:**
Inside your Node.js app, change the database connection string. Instead of connecting to `localhost`, you use the **container name** as the host.

- _Old:_ `mongodb://localhost:27017/myDatabase`
- _New:_ `mongodb://mongodb-c:27017/myDatabase`

```bash
# 3. Rebuild your Node app with the new connection string
docker build -t users-app .

# 4. Run the Node app on the SAME network
docker run --name node-c --network node_app_network -p 3000:3000 users-app

```

_Result:_ The Node.js server is now running and successfully connected to MongoDB via the isolated Docker network.
