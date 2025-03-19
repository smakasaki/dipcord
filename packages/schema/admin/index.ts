import { Type } from '@sinclair/typebox';
import { 
  ErrorResponse, 
} from '../common/index.js';
import { 
  UserRoleEnum, 
  SessionSchema, 
  UserErrorResponses
} from '../user/index.js';

// Admin user management schemas

// Admin update user request
export const AdminUpdateUserSchema = Type.Object({
  name: Type.Optional(Type.String()),
  surname: Type.Optional(Type.String()),
  email: Type.Optional(Type.String({ format: 'email' })),
  roles: Type.Optional(Type.Array(UserRoleEnum)),
});

// User role management
export const UserRoleManagementSchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  role: UserRoleEnum,
});

// User role updated response
export const UserRoleUpdatedSchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  roles: Type.Array(UserRoleEnum),
  message: Type.String(),
});

// Admin session management schemas

// User sessions list
export const UserSessionsListSchema = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  sessions: Type.Array(SessionSchema),
});

// Admin delete session response
export const DeleteSessionResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
});

// Admin delete all user sessions response
export const DeleteAllUserSessionsResponseSchema = Type.Object({
  deletedCount: Type.Number(),
  message: Type.String(),
});

// Admin statistics
export const AdminStatisticsSchema = Type.Object({
  totalUsers: Type.Number(),
  totalActiveSessions: Type.Number(),
  newUsersThisMonth: Type.Number(),
  activeSessionsAverage: Type.Number(),
});


export const AdminErrorResponses = {
  ...UserErrorResponses,
  403: ErrorResponse,
};

// Export types for TypeScript usage
export type AdminUpdateUser = typeof AdminUpdateUserSchema.static;
export type UserRoleManagement = typeof UserRoleManagementSchema.static;
export type UserRoleUpdated = typeof UserRoleUpdatedSchema.static;
export type UserSessionsList = typeof UserSessionsListSchema.static;
export type DeleteSessionResponse = typeof DeleteSessionResponseSchema.static;
export type DeleteAllUserSessionsResponse = typeof DeleteAllUserSessionsResponseSchema.static;
export type AdminStatistics = typeof AdminStatisticsSchema.static;