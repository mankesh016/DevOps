# NOTES.md: Week 27 - Docker Compose

## Week 27 (Class 1): Docker Compose

### Introduction to Docker Compose

- Normally, you don't use Docker to run projects locally unless the project is very complex and you don't know how to run it natively on your local machine.
- Usually, you run projects on Docker in VMs for deployment.
- However, Docker Compose allows you to start multiple containers together seamlessly.
- This is used more in local development and slightly less in VMs/deployment.
- **Docker Compose** is a tool designed to help you define and run multi-container Docker applications.
- With Compose, you use a YAML file to configure your application's services, networks, and volumes. Then, with a single command, you can create and start all the services from your configuration.
- By default, if you use Docker Compose, all the containers defined in it are automatically connected to the same default network.

### Basic Commands

- `docker-compose up` : Starts the services.
- `docker-compose up -d` : Runs the services in detached mode (in the background).
- `docker-compose -f custom-compose.yaml up -d` : Runs a specific compose file in the background.

### Structure of `docker-compose.yml`

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo
    container_name: mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db

  backend:
    image: backend_image
    container_name: backend_app
    depends_on:
      - mongodb
    ports:
      - "3000:3000"
    environment:
      MONGO_URL: "mongodb://mongodb:27017"

volumes:
  mongodb-data:
```

### Setting up a Postgres & Prisma Project

1. Initialize the project:
   `npm init -y`
   `npm install typescript`
   `npx tsc --init` (Set `rootDir` to `./src`, `outDir` to `./dist`)
2. Follow Prisma documentation for Postgres setup.
3. Install Express: `npm install express @types/express` and write basic express code in `index.ts`.
4. Create a user schema in `schema.prisma`.
5. Before migrating, you need a `DATABASE_URL`. Start a Postgres database first using Docker:
   `docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres`
6. Set the `.env` variable:
   `DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/postgres"`
7. Run migrations and generate client:
   `npx prisma migrate dev --name init`
   `npx prisma generate`
   - _(Use `npx prisma migrate reset` to reset all schemas if needed, and `npx prisma migrate deploy` to deploy existing migration to fresh database)._

8. `npx prisma migrate deploy` is used to apply migrations to a fresh database without keeping track of the history locally.

### Inspecting Local Database inside a Container

If you need to see the data inside a running Postgres container:

```bash
docker ps
docker exec -it <container-id> sh
psql -U postgres
\dt                     # to see all available tables
SELECT * FROM "User";

```

### Addressing the `--network host` Issue during Build

- **The Problem:** We are running two containers. While building the image, it need to connet to database container (to apply migrations) which is on a specific bridge network ('user-project'). We cannot pass a custom network flag while building the image `docker build`.
- **The Solution (Hack):** We use `--network host` during the build so that the builder can use the host machine's network to access port `5432` (where the database container is running) to migrate the database schema.
- **The Better Solution:** Move the Prisma migration logic out of the build step (`RUN`) and into the runtime step (`CMD`).
- Modify the `Dockerfile` `CMD` instruction to run the migration _before_ starting the app:
  `CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]`
- Now, the migration happens when the container _starts_ (at runtime), where it is already attached to the correct Docker network and can securely communicate with the database container.

### Final `docker-compose.yml` Example

```yaml
version: "3.8"

services:
  db:
    image: postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: mysecretpassword

  user-project:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:mysecretpassword@db:5432/postgres
    ports:
      - "3000:3000"
    depends_on:
      - db
```

### Run docker-compose.yml file

Command: `docker-compose up`

```bash
[+] up 4/4
✔ Image class-1-docker-compose-user_project       Built              27.6s
✔ Network class-1-docker-compose_default          Created            0.0s
✔ Container class-1-docker-compose-db-1           Created            0.3s
✔ Container class-1-docker-compose-user_project-1 Created            0.1s
```
