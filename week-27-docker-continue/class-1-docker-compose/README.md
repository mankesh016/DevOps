# Week 27: Docker Compose

This section explores **Docker Compose**, an essential tool for defining and orchestrating multi-container Docker applications. While Docker handles individual containers, Docker Compose allows you to spin up entire environments (e.g., a Node.js backend and a PostgreSQL database) with a single command.

---

## 🚀 The Philosophy of Docker Compose

When building complex applications, you rarely rely on a single service. A typical full-stack app requires a web server, a database, and perhaps a caching layer like Redis. Managing these individually via `docker run` commands is tedious and error-prone.

**Docker Compose solves this by:**

1. Allowing you to declare your entire infrastructure configuration in a single `docker-compose.yml` file.
2. Automatically creating an isolated virtual network so all defined containers can communicate with each other using their service names (e.g., `http://db:5432`).
3. Starting, stopping, and rebuilding all services with a single, memorable command.

_Note: Docker Compose is heavily utilized for streamlining local development environments. For production deployments, orchestration tools like Kubernetes are generally preferred over Compose._

---

## 🛠️ Project Example: Node.js + PostgreSQL + Prisma

To demonstrate Docker Compose, we configured a standard backend architecture utilizing Node.js, Express, PostgreSQL, and Prisma ORM.

### The Architecture Problem: Timing and Networking

A common hurdle when containerizing applications with a database is handling database migrations.

**The Flawed Approach:** Running `npx prisma migrate deploy` as a `RUN` instruction inside the `Dockerfile`.

- **Why it fails:** The `RUN` instruction executes during the _build phase_. During the build phase, the image does not have access to the Compose network, so it cannot reach the PostgreSQL database to apply the migrations.

**The Solution:** Defer the migration script to the _runtime phase_.
Modify the `Dockerfile`'s final `CMD` instruction to execute the migrations immediately before starting the Node server:

```dockerfile
# Inside Dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]

```

Because the `CMD` instruction executes when the container _starts_, the container is already securely attached to the Compose network and can successfully connect to the database.

---

## 📄 The `docker-compose.yml` Configuration

Here is the declarative configuration that brings the entire architecture to life.

```yaml
version: "3.8"

services:
  # 1. The Database Service
  db:
    image: postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: mysecretpassword

  # 2. The Application Service
  user-project:
    build: . # Tells Compose to build the Dockerfile in the current directory
    ports:
      - "3000:3000"
    environment:
      # Notice the host is 'db' (the service name), not 'localhost'
      DATABASE_URL: postgresql://postgres:mysecretpassword@db:5432/postgres
    depends_on:
      - db # Ensures the database starts before the application
```

---

## ⌨️ Essential Commands

| Command                | Action                                                                           |
| ---------------------- | -------------------------------------------------------------------------------- |
| `docker-compose up`    | Builds (if necessary), creates, and starts all services attached to the console. |
| `docker-compose up -d` | Starts all services in detached mode (background).                               |
| `docker-compose down`  | Stops and removes containers, networks, and images created by `up`.              |
| `docker-compose build` | Explicitly rebuilds the images defined in the compose file.                      |

### Accessing the Internal Database

If you need to manually inspect the data inside the running PostgreSQL container:

```bash
docker ps                                  # Find the DB container ID
docker exec -it <container-id> sh          # Open an interactive shell
psql -U postgres                           # Access the PostgreSQL CLI
\dt                                        # List all tables
SELECT * FROM "User";                      # Query the data

```
