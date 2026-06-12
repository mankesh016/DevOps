import { prisma } from "@repo/db/prisma";
import express from "express";

const app = express();
app.use(express.json());

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({});
  res.json(users);
});

app.post("/user", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const user = await prisma.user.create({
    data: {
      username,
      password,
    },
  });

  res.json({
    message: "User created successfully",
    user,
  });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
