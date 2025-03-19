// packages/schema/user/index.ts

import { Type } from '@sinclair/typebox';
import { ErrorResponse, ID, PaginationResult } from '../common/index.js';

// Define user roles
export const UserRoleEnum = Type.Union([
  Type.Literal('user'),
  Type.Literal('admin')
]);

// Base user properties
const UserBase = Type.Object({
  name: Type.String(),
  surname: Type.String(),
  email: Type.String({ format: 'email' }),
});

// Create user request body
export const CreateUserSchema = Type.Intersect([
  UserBase,
  Type.Object({
    password: Type.String({ minLength: 8 }),
  }),
]);

// User response (without password)
export const UserSchema = Type.Intersect([
  ID,
  UserBase,
  Type.Object({
    roles: Type.Array(UserRoleEnum),
    createdAt: Type.String({ format: 'date-time' }),
    updatedAt: Type.String({ format: 'date-time' }),
  }),
]);

// Login request body
export const LoginSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String(),
});

// Authentication token response
export const AuthTokenSchema = Type.Object({
  accessToken: Type.String(),
});

// User ID parameter
export const UserIdParamSchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
});

// Paginated users response
export const PaginatedUsersSchema = PaginationResult(UserSchema);

// Public user profile (limited information)
export const PublicUserProfileSchema = Type.Intersect([
  ID,
  Type.Object({
    name: Type.String(),
    surname: Type.String(),
  }),
]);

// Update user profile request
export const UpdateUserProfileSchema = Type.Partial(UserBase);

// Request password reset schema
export const RequestPasswordResetSchema = Type.Object({
  email: Type.String({ format: 'email' }),
});

// Reset password schema
export const ResetPasswordSchema = Type.Object({
  token: Type.String(),
  password: Type.String({ minLength: 8 }),
});

// Change password schema
export const ChangePasswordSchema = Type.Object({
  currentPassword: Type.String(),
  newPassword: Type.String({ minLength: 8 }),
});

// Session schema
export const SessionSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  token: Type.String(),
  ipAddress: Type.Optional(Type.String()),
  userAgent: Type.Optional(Type.String()),
  createdAt: Type.String({ format: 'date-time' }),
  expiresAt: Type.String({ format: 'date-time' }),
  lastUsedAt: Type.String({ format: 'date-time' }),
});

// Sessions list response
export const SessionsListSchema = Type.Object({
  sessions: Type.Array(SessionSchema),
});

// Error responses
export const UserErrorResponses = {
  400: ErrorResponse,
  401: ErrorResponse,
  403: ErrorResponse,
  404: ErrorResponse,
  409: ErrorResponse,
  500: ErrorResponse,
};

// Export types for TypeScript usage
export type CreateUser = typeof CreateUserSchema.static;
export type User = typeof UserSchema.static;
export type Login = typeof LoginSchema.static;
export type AuthToken = typeof AuthTokenSchema.static;
export type UserIdParam = typeof UserIdParamSchema.static;
export type UpdateUserProfile = typeof UpdateUserProfileSchema.static;
export type RequestPasswordReset = typeof RequestPasswordResetSchema.static;
export type ResetPassword = typeof ResetPasswordSchema.static;
export type ChangePassword = typeof ChangePasswordSchema.static;
export type Session = typeof SessionSchema.static;
export type UserRole = 'user' | 'admin';