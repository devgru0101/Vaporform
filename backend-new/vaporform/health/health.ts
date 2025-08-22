import { api } from "encore.dev/api";

// Health check endpoint
export const health = api(
  { expose: true, method: "GET", path: "/health" },
  async (): Promise<HealthResponse> => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "vaporform",
      version: "1.0.0"
    };
  }
);

interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
  version: string;
}
