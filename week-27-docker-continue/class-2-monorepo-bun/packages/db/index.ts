import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// const prisma = new PrismaClient();

// async function main() {
//   await prisma.user.create({
//     data: {
//       username: "Alice",
//       password: "alicePass",
//     },
//   });
//   const users = await prisma.user.findMany({});
//   console.log(users);

//   console.log("Hello via Bun!");
// }
// main();
