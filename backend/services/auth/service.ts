import { api } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

// Database instance
const db = new SQLDatabase("auth", {
  migrations: "./migrations",
});

// JWT secret (in production, this should be from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = "7d";
const REFRESH_TOKEN_EXPIRES_DAYS = 30;

// Types
interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean;
  last_login: Date | null;
}

interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  ip_address: string | null;
  user_agent: string | null;
}

interface LoginRequest {
  email: string;
  password: string;
  ip_address?: string;
  user_agent?: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  ip_address?: string;
  user_agent?: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    email_verified: boolean;
    last_login: Date | null;
  };
}

interface RefreshTokenRequest {
  refreshToken: string;
}

interface LogoutRequest {
  token: string;
}

// Helper functions
function generateTokens(userId: string) {
  const token = jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: `${REFRESH_TOKEN_EXPIRES_DAYS}d` });
  return { token, refreshToken };
}

function createUserResponse(user: User): AuthResponse['user'] {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    email_verified: user.email_verified,
    last_login: user.last_login,
  };
}

// Authentication endpoints
export const register = api(
  { method: "POST", path: "/auth/register" },
  async (req: RegisterRequest): Promise<AuthResponse> => {
    try {
      // Check if user already exists
      const existingUser = await db.query`
        SELECT id FROM users WHERE email = ${req.email}
      `;
      
      if (existingUser.length > 0) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(req.password, saltRounds);

      // Create user
      const userResult = await db.query`
        INSERT INTO users (email, password_hash, name, email_verified)
        VALUES (${req.email}, ${password_hash}, ${req.name}, false)
        RETURNING id, email, name, created_at, updated_at, email_verified, last_login
      `;

      const user = userResult[0] as User;
      
      // Generate tokens
      const { token, refreshToken } = generateTokens(user.id);
      
      // Create session
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
      await db.query`
        INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
        VALUES (${user.id}, ${refreshToken}, ${expiresAt}, ${req.ip_address || null}, ${req.user_agent || null})
      `;

      return {
        token,
        refreshToken,
        user: createUserResponse(user),
      };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }
);

export const login = api(
  { method: "POST", path: "/auth/login" },
  async (req: LoginRequest): Promise<AuthResponse> => {
    try {
      // Find user by email
      const userResult = await db.query`
        SELECT id, email, password_hash, name, created_at, updated_at, email_verified, last_login
        FROM users 
        WHERE email = ${req.email}
      `;

      if (userResult.length === 0) {
        throw new Error("Invalid email or password");
      }

      const user = userResult[0] as User;

      // Verify password
      const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
      if (!isValidPassword) {
        throw new Error("Invalid email or password");
      }

      // Update last login
      await db.query`
        UPDATE users 
        SET last_login = NOW()
        WHERE id = ${user.id}
      `;
      user.last_login = new Date();

      // Generate tokens
      const { token, refreshToken } = generateTokens(user.id);
      
      // Create session
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
      await db.query`
        INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
        VALUES (${user.id}, ${refreshToken}, ${expiresAt}, ${req.ip_address || null}, ${req.user_agent || null})
      `;

      return {
        token,
        refreshToken,
        user: createUserResponse(user),
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }
);

export const logout = api(
  { method: "POST", path: "/auth/logout" },
  async (req: LogoutRequest): Promise<{ success: boolean }> => {
    try {
      // Delete session
      await db.query`
        DELETE FROM sessions WHERE token = ${req.token}
      `;
      
      return { success: true };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
);

export const refreshToken = api(
  { method: "POST", path: "/auth/refresh" },
  async (req: RefreshTokenRequest): Promise<{ token: string; refreshToken: string }> => {
    try {
      // Verify refresh token
      const decoded = jwt.verify(req.refreshToken, JWT_SECRET) as { userId: string; type: string };
      
      if (decoded.type !== 'refresh') {
        throw new Error("Invalid token type");
      }

      // Check if session exists and is not expired
      const sessionResult = await db.query`
        SELECT id, user_id, expires_at
        FROM sessions 
        WHERE token = ${req.refreshToken} AND expires_at > NOW()
      `;

      if (sessionResult.length === 0) {
        throw new Error("Invalid or expired refresh token");
      }

      const session = sessionResult[0] as Session;

      // Generate new tokens
      const tokens = generateTokens(session.user_id);
      
      // Update session with new refresh token
      const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
      await db.query`
        UPDATE sessions 
        SET token = ${tokens.refreshToken}, expires_at = ${newExpiresAt}
        WHERE id = ${session.id}
      `;

      return {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }
);

// Token validation function for use by other services
export const validateToken = async (token: string): Promise<User | null> => {
  try {
    // Extract token from Bearer format if needed
    let authToken = token;
    if (token.startsWith('Bearer ')) {
      authToken = token.slice(7);
    }

    // Verify JWT token
    const decoded = jwt.verify(authToken, JWT_SECRET) as { userId: string; type: string };
    
    if (decoded.type !== 'access') {
      return null;
    }

    // Get user from database
    const userResult = await db.query`
      SELECT id, email, name, created_at, updated_at, email_verified, last_login
      FROM users 
      WHERE id = ${decoded.userId}
    `;

    if (userResult.length === 0) {
      return null;
    }

    return userResult[0] as User;
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = api(
  { method: "GET", path: "/auth/me" },
  async (req: { authorization?: string }): Promise<{ user: AuthResponse['user'] }> => {
    try {
      if (!req.authorization) {
        throw new Error("Authorization header required");
      }

      const user = await validateToken(req.authorization);
      if (!user) {
        throw new Error("Invalid token");
      }

      return {
        user: createUserResponse(user),
      };
    } catch (error) {
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }
);

// Legacy verify endpoint for backward compatibility
export const verify = api(
  { method: "GET", path: "/auth/verify" },
  async (): Promise<{ valid: boolean }> => {
    return { valid: true };
  }
);

// Cleanup expired sessions (utility endpoint)
export const cleanupSessions = api(
  { method: "POST", path: "/auth/cleanup-sessions" },
  async (): Promise<{ cleaned: number }> => {
    try {
      const result = await db.query`
        DELETE FROM sessions WHERE expires_at < NOW()
      `;
      
      return { cleaned: result.affectedRows || 0 };
    } catch (error) {
      throw new Error(`Session cleanup failed: ${error.message}`);
    }
  }
);