# NOTES.md: Week 28 - Class 1

## Vertical and Horizontal Scaling & Auto Scaling Groups (ASGs)

This class focuses on infrastructure architecture, specifically how to scale applications to handle varying loads, rather than writing application code.

### Topics Covered

- **Servers:** Cluster module, horizontal scaling, capacity estimation, ASGs, vertical scaling, and Load Balancers.
- **Databases:** Indexing, Normalization, and Sharding (covered conceptually).

---

### 1. The Threading Problem (Node.js vs. Other Languages)

- **Node.js:** Single-threaded by design. It doesn't have a native concept of threads for parallel execution in the same way other languages do.
- **Other Languages:** Rust and Java have actual threads, while Go uses goroutines, and Python has coroutines.

#### The Limit of Vertical Scaling in Node.js

- **Vertical Scaling** means increasing the size/power of a single machine (e.g., upgrading from a 2-core to a 6-core machine) to support more load.
- Single-threaded languages like JavaScript/Node.js are notoriously bad at vertical scaling. If you run a standard `node index.js` process on a 6-core machine, it can only utilize one core up to 100%, leaving the other 5 cores completely idle.
- To fix this in Node.js, you must either run multiple processes on different ports, use the `cluster` module, or split tasks into chunks for parallel CPU utilization (bringing all cores to ~60-70% usage instead of maxing out just one).

#### The Rust Advantage (Multi-threading)

In Rust, you can spawn multiple threads within a single process to fully utilize the CPU.

```rust
use std::thread;

fn main() {
    thread::spawn(|| {
        let mut counter: f64 = 0.00;
        loop {
            counter += 0.001;
        }
    });

    // Main thread keeps the program alive
    loop {}
}

```

_Running this can result in 700-800% CPU utilization on a multi-core machine because the OS manages context switching across multiple CPU cores._

---

### 2. Capacity Estimation (System Design Interviews)

In system design interviews, you are often asked to perform "Paper Math" to estimate capacity.

- **Questions asked:** How do you scale your server? How do you handle spikes? How do you maintain an SLA (Service Level Agreement) given a specific traffic load?.
- **The Process:** Estimate the requests per second (e.g., 10 million active users sending 50 requests a day) to find the baseline load. Then, design Auto Scaling Groups (ASGs) based on this monitoring.
- **Handling Spikes:** Traffic isn't uniform. Events like the World Cup, IPL, or festival sales cause massive spikes. You aggregate these requests, pass them through a Load Balancer, and rely on ASGs to dynamically provision more servers as the load increases.

---

### 3. Auto Scaling Strategies (Stateless vs. Stateful)

#### Stateless HTTP Servers

- For standard stateless servers, scaling up or down is straightforward based on needs.
- If a single request is highly CPU-intensive (e.g., AI video generation, processing YouTube uploads), tracking "requests per second" is a poor metric. Instead, scale based on **Average CPU/Memory Utilization**.
- _Example Policy:_ Scale up if average memory utilization hits 60%; scale down if it drops below 20%.

#### Draining Ephemeral Servers (Workers)

- For worker pipelines (like processing uploaded MP4s into 1080p, 720p, 360p), servers are ephemeral (temporary).
- **Safe Draining Process:** When scaling down, you don't just kill the server.

1. Remove the server from the Load Balancer so it stops receiving _new_ requests.
2. Allow it to finish processing its current tasks.
3. Stop/terminate the server.

- During this, the frontend continuously polls the backend for the processing status.

#### Stateful Connections

- WebSocket connections are long-running and persistent. They are not ephemeral, which makes gracefully scaling them down much more complex.
