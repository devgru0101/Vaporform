import { validateToken } from "../services/auth/service";

// Auth middleware helper for protecting API endpoints
export async function requireAuth(authorization?: string) {
  if (!authorization) {
    throw new Error("Authorization header required");
  }

  const user = await validateToken(authorization);
  if (!user) {
    throw new Error("Invalid or expired token");
  }

  return user;
}

// Interface for authenticated requests
export interface AuthenticatedRequest {
  authorization: string;
}

// Type guard for authenticated requests
export function isAuthenticatedRequest(req: any): req is AuthenticatedRequest {
  return req && typeof req.authorization === 'string';
}