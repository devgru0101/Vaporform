import { api } from 'encore.dev/api';
import { APICallMeta } from 'encore.dev';
import { authHandler } from 'encore.dev/auth';
import log from 'encore.dev/log';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

// User interface
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
}

// Auth data for token verification
export interface AuthData {
  userID: string;
  email: string;
  role: string;
}

// Request/Response schemas
const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const RegisterRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

const LoginResponse = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.enum(['admin', 'user']),
  }),
  token: z.string(),
});

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;

// Mock user storage (replace with database)
const users: Map<string, User & { passwordHash: string }> = new Map();

// Auth handler for Encore
export const auth = authHandler<AuthData>(async (token: string) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return {
      userID: payload.userID,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    log.error('Auth verification failed', { error: error.message });
    return null;
  }
});

// Login endpoint
export const login = api<typeof LoginRequest, typeof LoginResponse>(
  { method: 'POST', path: '/auth/login', expose: true },
  async (req): Promise<z.infer<typeof LoginResponse>> => {
    const { email, password } = req;
    
    log.info('Login attempt', { email });
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userID: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' },
    );
    
    // Update last login
    user.lastLogin = new Date();
    
    log.info('Login successful', { userID: user.id });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  },
);

// Register endpoint
export const register = api<typeof RegisterRequest, typeof LoginResponse>(
  { method: 'POST', path: '/auth/register', expose: true },
  async (req): Promise<z.infer<typeof LoginResponse>> => {
    const { email, password, name } = req;
    
    log.info('Registration attempt', { email, name });
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User & { passwordHash: string } = {
      id: userId,
      email,
      name,
      role: 'user',
      createdAt: new Date(),
      passwordHash,
    };
    
    users.set(userId, user);
    
    // Generate JWT token
    const token = jwt.sign(
      { userID: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' },
    );
    
    log.info('Registration successful', { userID: user.id });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    };
  },
);

// Get current user endpoint
export const me = api(
  { method: 'GET', path: '/auth/me', auth: true, expose: true },
  async (req: APICallMeta<AuthData>): Promise<User> => {
    const { userID } = req.auth;
    
    const user = users.get(userID);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  },
);