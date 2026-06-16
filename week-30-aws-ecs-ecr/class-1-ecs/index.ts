import express from "express";
import os from "os";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "hi" });
});

app.get("/cpu", (req, res) => {
  const LIMIT = 1_000_000_000;
  for (let i = 0; i < LIMIT; i++) {
    Math.random();
  }
  res.send({
    message: `Host: ${os.hostname()}`,
  });
});

app.listen(3000, () => {
  console.log("Server is listening on post 3000");
});
