import { Type } from "@sinclair/typebox";

import { Session } from "../auth/index.js";
import {
    ErrorResponse,
} from "../common/index.js";
import {
    UserErrorResponses,
    UserRoleEnum,
} from "../user/index.js";

export const AdminUpdateUserSchema = Type.Object({
    name: Type.Optional(Type.String()),
    surname: Type.Optional(Type.String()),
    email: Type.Optional(Type.String({ format: "email" })),
    roles: Type.Optional(Type.Array(UserRoleEnum)),
});

export const UserRoleManagementSchema = Type.Object({
    userId: Type.String({ format: "uuid" }),
    role: UserRoleEnum,
});

export const UserRoleUpdatedSchema = Type.Object({
    userId: Type.String({ format: "uuid" }),
    roles: Type.Array(UserRoleEnum),
    message: Type.String(),
});

export const UserSessionsListSchema = Type.Object({
    userId: Type.String({ format: "uuid" }),
    sessions: Type.Array(Session),
});

export const DeleteSessionResponseSchema = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
});

export const DeleteAllUserSessionsResponseSchema = Type.Object({
    deletedCount: Type.Number(),
    message: Type.String(),
});

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

export type AdminUpdateUser = typeof AdminUpdateUserSchema.static;
export type UserRoleManagement = typeof UserRoleManagementSchema.static;
export type UserRoleUpdated = typeof UserRoleUpdatedSchema.static;
export type UserSessionsList = typeof UserSessionsListSchema.static;
export type DeleteSessionResponse = typeof DeleteSessionResponseSchema.static;
export type DeleteAllUserSessionsResponse = typeof DeleteAllUserSessionsResponseSchema.static;
export type AdminStatistics = typeof AdminStatisticsSchema.static;
