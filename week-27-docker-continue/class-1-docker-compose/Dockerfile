FROM node:22

WORKDIR /app

COPY package* .

RUN npm install

COPY . . 

RUN npm run build

EXPOSE 3000

CMD ["sh", "-c","npx prisma migrate deploy && npm start"]