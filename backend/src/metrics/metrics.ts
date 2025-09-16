import type { Request, Response } from "express";
import client from "prom-client";

client.collectDefaultMetrics();

export const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP latency",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export function metricsHandler(_req: Request, res: Response) {
  res.setHeader("Content-Type", client.register.contentType);
  res.end(client.register.metrics());
}
