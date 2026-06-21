import express from "express";
import type { Request, Response, NextFunction } from "express";
import promClient from "prom-client";

const requestCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

const activeRequestsGauge = new promClient.Gauge({
  name: "active_request_count",
  help: "Total Number of Active Requests",
});

const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 5000],
});

const middleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  activeRequestsGauge.inc();

  res.on("finish", () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`Request took ${duration} ms`);

    requestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path, // /users/123, /users/222, /users/444 => /users/:params
      status_code: res.statusCode,
    });

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route: req.route ? req.route.path : req.path,
        status_code: res.statusCode,
      },
      duration,
    );
    activeRequestsGauge.dec();
  });

  next();

  // const endTime = Date.now();
  // console.log(
  //   `Request took ${endTime - startTime} ms on endpoint ${req.url} with method ${req.method}, response status code is ${res.statusCode}`,
  // );
};

const app = express();
app.use(express.json());
app.use(middleware);

app.get("/cpu", async (req, res) => {
  console.log("Request on endpoint /cpu");
  // await new Promise((resolve) => setTimeout(resolve, 10000));
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
  res.send("CPU intensive task completed");
});

app.get("/health", (req, res) => {
  console.log("Request on endpoint /health");
  res.send("Healthy");
});
app.get("/", (req, res) => {
  res.send("request on / endpoint");
});

app.get("/metrics", async (req, res) => {
  const metrics = await promClient.register.metrics();
  res.set("Content-Type", promClient.register.contentType);
  res.end(metrics); // res.end will send metrics
});
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
