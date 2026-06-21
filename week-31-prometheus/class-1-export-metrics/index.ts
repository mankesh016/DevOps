import express from "express";
import type { Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());

const middleware = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  await next();
  const endTime = Date.now();
  console.log(
    `Request took ${endTime - startTime} ms on endpoint ${req.url} with method ${req.method}, response status code is ${res.statusCode}`,
  );
};

app.use(middleware);

app.get("/cpu", (req, res) => {
  console.log("Request on endpoint /cpu");
  for (let i = 0; i < 1000000000; i++) {
    Math.random();
  }
  res.send("CPU intensive task completed");
});

app.get("/health", (req, res) => {
  console.log("Request on endpoint /health");
  res.send("Healthy");
});
app.get("/", (req, res) => {
  res.send("request on / endpoint");
});
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
