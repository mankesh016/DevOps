# Week 31: System Monitoring with Prometheus & Grafana

This section focuses on building a robust, self-hosted observability stack. We transition away from expensive, proprietary, managed services (like New Relic or Datadog) and learn how to instrument our applications using the industry-standard open-source combination: **Prometheus** (for data collection and storage) and **Grafana** (for data visualization).

---

## 🏗️ The Prometheus Architecture: The PULL Model

Unlike traditional monitoring tools where your application actively _pushes_ data to a logging server, Prometheus operates on a **PULL architecture**.

Prometheus acts as an active scraper. You configure it with a list of target endpoints (using Service Discovery for dynamic cloud environments like Kubernetes), and Prometheus makes periodic HTTP requests to those endpoints to fetch the latest metrics.

**Handling Short-Lived Jobs:**
Because Prometheus pulls on a fixed interval (e.g., every 15 seconds), it might entirely miss a background worker script that runs and completes in 2 seconds. To solve this, short-lived jobs push their metrics to an intermediary component called the **Push Gateway**. Prometheus then leisurely pulls those aggregated metrics from the Gateway.

---

## 📊 Instrumentation: The 3 Core Metrics

To expose metrics from a Node.js/Express application, we utilize the `prom-client` library. It exposes a `/metrics` endpoint that Prometheus can scrape. We track system health using three primary metric types:

### 1. Counter

A value that **only ever goes up** (or resets to 0 on a server restart).

- _Use Case:_ Total number of HTTP requests processed, total number of 404 errors, total orders placed.

### 2. Gauge

A value that represents a snapshot of state and can **arbitrarily go up or down**.

- _Use Case:_ Active concurrent HTTP requests, current CPU temperature, current memory usage, length of a job queue.

### 3. Histogram

A more complex metric used to track the distribution of data points across predefined "buckets" in a cumulative fashion.

- _Use Case:_ HTTP Request Duration (e.g., counting how many requests took `< 50ms`, `< 100ms`, `< 500ms`). By using buckets, we lose the exact duration of an individual request, but we save massive amounts of storage space while still being able to accurately calculate p95 and p99 percentiles in Grafana.

---

## 🔗 Resources

- [Prometheus and Grafana Class Slides](https://projects.100xdevs.com/tracks/prom-graf-1/Prometheus-and-Grafana-10)
