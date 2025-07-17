import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models';

export const createJWT = (payload: any): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
};

export const createTestUser = async (userData: any = {}) => {
  const defaultUserData = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'password123',
    isEmailVerified: true,
    role: 'user',
    ...userData
  };

  return await User.create(defaultUserData);
};

export const createAuthHeaders = (user: any) => {
  const token = createJWT({
    id: user.id,
    email: user.email,
    role: user.role
  });

  return {
    Authorization: `Bearer ${token}`
  };
};

export const generateTestToken = (payload: any = {}): string => {
  const defaultPayload = {
    id: '1',
    email: 'test@example.com',
    role: 'user',
    ...payload
  };
  
  return createJWT(defaultPayload);
};

export const cleanupDatabase = async () => {
  // Clean up test data
  // This will be called after each test to ensure clean state
  await User.destroy({ where: {}, truncate: true });
};