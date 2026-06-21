# NOTES.md: Week 31 - Prometheus and Grafana

## 1. Introduction to Prometheus & Grafana

While tools like New Relic and Datadog are popular, they come with significant drawbacks: they are paid, cannot be self-hosted, mean you don't own your own data, and cause vendor lock-in (it is very hard to move away from them). Most large companies will use either Datadog, New Relic, or a custom Prometheus-Grafana stack.

- **Prometheus** is a time-series database designed to monitor your processes (Node.js, Go, Rust, etc.) and hosts.
- _Note: TimescaleDB is another popular time-series database._

## 2. The Architecture of Prometheus

Unlike many monitoring tools that wait for applications to send them data, Prometheus uses a **PULL architecture**.

- **Pull Model:** Prometheus scrapes (pulls) metrics from your applications at fixed time intervals over HTTP and stores them in its time-series database.
- **Service Discovery:** Targets (like ephemeral nodes in a Kubernetes cluster) are dynamically discovered so Prometheus knows where to pull metrics from.
- **Push Gateway (For Short-lived Jobs):** Short-lived jobs finish too quickly for Prometheus to pull from them. In this case, the short-lived jobs actively _push_ their metrics to an intermediary "Push Gateway," which Prometheus then pulls from.

**Scaling Limitations:**
Prometheus cannot easily scale horizontally and generally runs on a single machine. To manage storage, companies usually keep only a few months of data rather than years of data.

---

## 3. Tracking Custom Metrics in Node.js

Prometheus collects data continuously, even if no users are hitting your application. To track custom application data (like Request Count, Request Duration, or total 404 errors), we use the `prom-client` library.

### The 3 Important Types of Metrics

#### A. Counter

A counter is a cumulative metric that **only goes up** (or resets to zero on restart).

```typescript
import promClient from "prom-client";

const requestCounter = new promClient.Counter({
  name: "http_requests_total",
  help: "Total Number of HTTP requests",
  labelNames: ["method", "route", "status"],
});
```

Labels (Dimensions) allow you to tag data, e.g., `{method="GET", route="/health", statuscode="200"}`.

B. Gauge

A gauge is a metric that represents a single numerical value that can arbitrarily **increase or decrease** (e.g., active concurrent requests).

```typescript
activeRequestGauge.inc(); // Increment
activeRequestGauge.dec(); // Decrement
```

C. Histogram

Histograms sample observations (like request durations) and count them in cumulative configurable buckets.

- **Pros & Cons:** You lose individual request data but gain highly aggregated data that takes up much less storage space.

```typescript
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 5000], // Defines the boundaries
});
```

---

### Assignments

- Learn about and implement the `express-grafana-exporter` (Easy).

- Create a Go/FastAPI/Rust server and expose Prometheus endpoints from it (Easy).

- Read through the open-source codebase of Grafana (Hard).

- Go through the code of `prom-client` (Easy).

- Build a custom `prom-client` from scratch (Easy).

### Useful links

Class Slides: [Prometheus and Grafana 10](https://projects.100xdevs.com/tracks/prom-graf-1/Prometheus-and-Grafana-10)
