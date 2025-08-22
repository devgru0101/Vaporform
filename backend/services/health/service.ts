import { api } from "encore.dev/api";

export const health = api(
  { method: "GET", path: "/health" },
  async (): Promise<{ status: string; timestamp: string }> => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString()
    };
  }
);

export const ping = api(
  { method: "GET", path: "/ping" },
  async (): Promise<{ message: string }> => {
    return {
      message: "pong"
    };
  }
);