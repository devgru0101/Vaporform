import { api, Header, APIError } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import log from "encore.dev/log";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Import service definition
import "./encore.service";

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  createdAt: Date;
  lastLogin?: Date;
}

// Auth parameters for header-based authentication
interface AuthParams {
  authorization: Header<"Authorization">;
}

// Auth data for token verification
export interface AuthData {
  userID: string;
  email: string;
  role: string;
}

// Request/Response interfaces (pure TypeScript - no Zod)
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
}

interface LoginResponse {
  user: UserInfo;
  token: string;
}

interface VerifyResponse {
  user: UserInfo;
  valid: boolean;
}

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || "vaporform-secret-key";
const SALT_ROUNDS = 12;

// Mock user storage (replace with database)
const users: Map<string, User & { passwordHash: string }> = new Map();

// Seed with demo user
const demoPasswordHash = bcrypt.hashSync("password123", SALT_ROUNDS);
users.set("demo@vaporform.com", {
  id: "demo-user-id",
  email: "demo@vaporform.com",
  name: "Demo User",
  role: "user",
  createdAt: new Date(),
  passwordHash: demoPasswordHash,
});

// Auth handler for Encore
export const auth = authHandler<AuthParams, AuthData>(
  async ({ authorization }): Promise<AuthData> => {
    try {
      // Extract token from Authorization header
      const token = authorization?.replace("Bearer ", "");
      
      if (!token) {
        throw APIError.unauthenticated("Missing authorization token");
      }

      const payload = jwt.verify(token, JWT_SECRET) as any;
      return {
        userID: payload.userID,
        email: payload.email,
        role: payload.role,
      };
    } catch (error) {
      log.error("Auth verification failed", { error: (error as Error).message });
      throw APIError.unauthenticated("Invalid token");
    }
  }
);

// Validation functions (replacing Zod)
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return Boolean(password && password.length >= 8);
}

function validateName(name: string): boolean {
  return Boolean(name && name.trim().length > 0);
}

// Login endpoint
export const login = api(
  { method: "POST", path: "/auth/login", expose: true },
  async ({ email, password }: LoginRequest): Promise<LoginResponse> => {
    log.info("Login attempt", { email });

    // Validation
    if (!validateEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters");
    }

    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT token
    const token = jwt.sign(
      { userID: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update last login
    user.lastLogin = new Date();

    log.info("Login successful", { userID: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  }
);

// Register endpoint
export const register = api(
  { method: "POST", path: "/auth/register", expose: true },
  async ({ email, password, name }: RegisterRequest): Promise<LoginResponse> => {
    log.info("Registration attempt", { email, name });

    // Validation
    if (!validateEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!validatePassword(password)) {
      throw new Error("Password must be at least 8 characters");
    }
    if (!validateName(name)) {
      throw new Error("Name is required");
    }

    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const newUser: User & { passwordHash: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      name: name.trim(),
      role: "user",
      createdAt: new Date(),
      passwordHash,
    };

    users.set(email, newUser);

    // Generate JWT token
    const token = jwt.sign(
      { userID: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    log.info("Registration successful", { userID: newUser.id });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      },
      token,
    };
  }
);

// Verify token endpoint  
export const verify = api(
  { method: "POST", path: "/auth/verify", expose: true },
  async (): Promise<VerifyResponse> => {
    log.info("Token verification");

    // For demo purposes, return a mock response
    const user = Array.from(users.values())[0]; // Get first user
    if (!user) {
      return {
        user: {
          id: "demo-user",
          email: "demo@example.com",
          name: "Unknown",
          role: "user" as "admin" | "user",
        },
        valid: false,
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      valid: true,
    };
  }
);