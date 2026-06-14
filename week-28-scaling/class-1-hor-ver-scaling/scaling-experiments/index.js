// import cluster from "cluster";
import express from "express";
// import os from "os";

// const totalCPUs = os.cpus().length;

// const port = process.env.PORT || 3000;

// if (cluster.isPrimary) {
//   console.log("No of total CPUs is ", totalCPUs);
//   console.log(`Primary ${process.pid} is running`);
//   for (let i = 0; i < totalCPUs; i++) {
//     cluster.fork();
//   }

//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`worker ${worker.process.pid} died`);
//     console.log("Starting a new worker");
//     cluster.fork();
//   });
// } else {

console.log(`Worker ${process.pid} started`);
export const app = express();

app.get("/", (req, res) => {
  res.send(`Hello World! Request is handled by the worker ${process.pid}`);
});

app.get("/pid", (req, res) => {
  res.send(`Request is handled by the worker ${process.pid}`);
});

app.get("/cpu", (req, res) => {
  for (let i = 0; i < 1000000000; i++) {
    Math.random();
  }
  res.send(
    `CPU intensive task! Request is handled by the worker ${process.pid}`,
  );
});

app.get("/host", (req, res) => {
  res.send(os.hostname());
});

//   app.listen({ port }, () => {
//     console.log(`Server is running on port: ${port}`);
//   });
// }
