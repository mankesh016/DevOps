import { PrismaClient } from "@prisma/client";
import express from "express";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/", async (req: any, res) => {
  const allUsers = await prisma.user.findMany({});
  res.send(allUsers);
});
app.post("/", async (req: any, res: any) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await prisma.user.create({
    data: {
      username,
      password,
    },
  });

  res.send({
    message: "Registered successfully",
    user: user,
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
