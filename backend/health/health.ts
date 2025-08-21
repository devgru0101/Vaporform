import { api } from "encore.dev/api";

interface HealthResponse {
  status: string;
  timestamp: string;
  environment: string;
  version: string;
}

interface StatusResponse {
  message: string;
  version: string;
}

// Health endpoint
export const health = api(
  { expose: true, method: "GET", path: "/health" },
  async (): Promise<HealthResponse> => {
    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    };
  }
);

// API status endpoint
export const status = api(
  { expose: true, method: "GET", path: "/api/status" },
  async (): Promise<StatusResponse> => {
    return {
      message: "Vaporform Backend API is running on Encore.ts",
      version: "1.0.0",
    };
  }
);