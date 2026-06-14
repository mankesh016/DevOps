const target = 1_000_000_000;

const startTime = Date.now();
let totalSum = 0n;

for (let i = 1; i <= target; i++) {
  totalSum += BigInt(i);
}

console.log("Total sum:", totalSum);
const endTime = Date.now();
console.log("Time taken:", endTime - startTime);
