import cluster from "cluster";
import os from "os";
import { app } from "./index.js";

const totalCPUs = os.cpus().length;

const port = process.env.PORT || 3000;

if (cluster.isPrimary) {
  console.log("No of total CPUs is ", totalCPUs);
  console.log(`Primary ${process.pid} is running`);
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Starting a new worker");
    cluster.fork();
  });
} else {
  app.listen({ port }, () => {
    console.log(`Server is running on port: ${port}`);
  });
}
