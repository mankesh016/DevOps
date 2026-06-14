import cluster from "cluster";
import os from "os";

const target = 1_000_000_000;
const totalCPUs = 1;
const chunkSize = Math.floor(target / totalCPUs);

if (cluster.isPrimary) {
  const startTime = Date.now();
  let totalSum = 0n;
  let completedWorkers = 0;

  for (let i = 0; i < totalCPUs; i++) {
    const worker = cluster.fork();
    const from = i * chunkSize;
    const to = i === totalCPUs - 1 ? target : (i + 1) * chunkSize - 1;
    worker.send({ from, to });

    worker.on("message", (msg) => {
      totalSum += BigInt(msg.partialSum);
      completedWorkers++;
      console.log("Sum Recieved:", msg.partialSum);

      if (completedWorkers === totalCPUs) {
        console.log("Total sum:", totalSum);
        const endTime = Date.now();
        console.log("Time taken:", endTime - startTime);
        process.exit();
      }
    });
  }

  console.log(totalSum);
} else {
  process.on("message", (msg) => {
    const { from, to } = msg;
    let partialSum = 0n;

    for (let i = from; i <= to; i++) {
      partialSum += BigInt(i);
    }
    process.send({ partialSum: partialSum.toString() });
    console.log(partialSum);
  });
}
