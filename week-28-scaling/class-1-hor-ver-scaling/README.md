# Week 28: Infrastructure Scaling, Capacity Estimation & ASGs

This section transitions from writing application code to managing cloud infrastructure. We explore how to design architectures that can handle massive traffic spikes, the limitations of single-threaded runtimes like Node.js, and how to automate server provisioning using Auto Scaling Groups (ASGs) and Load Balancers.

---

## 🚀 Key Concepts

### 1. Vertical vs. Horizontal Scaling

- **Vertical Scaling (Scaling Up):** Increasing the computational power of a single machine (adding more CPU cores or RAM).
  - _The Node.js Limitiation:_ Because Node.js is single-threaded, it cannot natively take advantage of a multi-core machine for a single process. A heavy computation will block the single event loop, maxing out 1 core while leaving the others idle.
- **Horizontal Scaling (Scaling Out):** Adding more machines to the resource pool. This is the preferred method for scaling web applications. A Load Balancer distributes incoming traffic evenly across multiple identical servers.

### 2. Capacity Estimation

A core component of System Design interviews ("Paper Math"). It involves calculating the required infrastructure based on expected load:

- Estimating baseline **Requests Per Second (RPS)** based on Daily Active Users (DAU).
- Designing buffers for sudden traffic spikes (e.g., e-commerce sales, live sports streams).
- Establishing Service Level Agreements (SLAs) to guarantee uptime and response latency.

### 3. Auto Scaling Groups (ASGs)

ASGs automatically adjust the number of active servers in your fleet based on real-time demand.

- **Stateless Applications:** Easily scaled by duplicating instances.
- **Scaling Metrics:** For standard web traffic, RPS is a good metric. However, for compute-heavy tasks (like AI generation or video transcoding), scaling based on **Average CPU/Memory Utilization** is much more accurate.
- **Connection Draining:** When an ASG scales _down_, servers must be removed gracefully. They are first detached from the Load Balancer to stop new traffic, allowed to finish their current processing queues, and then safely terminated.

---

## 🔗 Class Slides & Resources

- [Class 1 Slides: Horizontal and vertical scaling](https://projects.100xdevs.com/tracks/hor-ver-scaling/Horizontal-and-vertical-scaling--Indexes-in-DBs-2)
- [Class 2 Slides: Autoscaling groups](https://petal-estimate-4e9.notion.site/Autoscaling-groups-1a27dfd1073580adaaccc785189f156f)
