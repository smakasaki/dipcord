import { Type } from '@sinclair/typebox';
import { ErrorResponse, ID, PaginationResult } from '../common/index.js';

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

// Error responses
export const UserErrorResponses = {
  400: ErrorResponse,
  401: ErrorResponse,
  404: ErrorResponse,
  500: ErrorResponse,
};

// Export types for TypeScript usage
export type CreateUser = typeof CreateUserSchema.static;
export type User = typeof UserSchema.static;
export type Login = typeof LoginSchema.static;
export type AuthToken = typeof AuthTokenSchema.static;
export type UserIdParam = typeof UserIdParamSchema.static;