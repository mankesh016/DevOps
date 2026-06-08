import express from "express";
import { client } from "@repo/db/client";
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello there! Its home page, make a post request at /signup");
});

app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await client.user.create({
    data: {
      username,
      password,
    },
  });

  console.log("User created");

  res.send({
    message: "Registered successfully",
    user: user,
  });
});

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
