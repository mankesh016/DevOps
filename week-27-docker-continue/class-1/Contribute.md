## Manual Installation

- Install nodejs locally
- Clone the repo
- Install dependencies (npm install)
- start the DB locally
  - docker run -p 5432:5432 -d -e POSTGRES_PASSWORD=mysecretpassword postgres
  - or get a db url from neon.tech
- update db url .env file
- npx prisma migrate
- npx prisma generate
- npm run build
- npm run start

## Docker installation

- Install docker
- Create a network `docker network create user_project`
- Start postgres
  - `docker run --network user_project --name postgres -p 5432:5432 -d -e POSTGRES_PASSWORD=mysecretpassword postgres`
- Build the image - `docker build --network host -t user-project .`
- Start the image - `docker run --network user_project -e DATABASE_URL="postgresql://postgres:mysecretpassword@postgres:5432/postgres" -p 3000:3000 user-project`

## Docker Compose installation steps

- Install docker, docker-compose
- Run `docker-compose up`
