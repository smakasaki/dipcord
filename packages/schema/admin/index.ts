import { z } from "zod";

import { Session } from "../auth/index.js";
import {
    ErrorResponse,
} from "../common/index.js";
import {
    UserErrorResponses,
    UserRoleEnum,
} from "../user/index.js";

export const AdminUpdateUserSchema = z.object({
    name: z.string().optional(),
    surname: z.string().optional(),
    email: z.string().email().optional(),
    roles: z.array(UserRoleEnum).optional(),
});

export const UserRoleManagementSchema = z.object({
    userId: z.string().uuid(),
    role: UserRoleEnum,
});

export const UserRoleUpdatedSchema = z.object({
    userId: z.string().uuid(),
    roles: z.array(UserRoleEnum),
    message: z.string(),
});

export const UserSessionsListSchema = z.object({
    userId: z.string().uuid(),
    sessions: z.array(Session),
});

export const DeleteSessionResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export const DeleteAllUserSessionsResponseSchema = z.object({
    deletedCount: z.number(),
    message: z.string(),
});

export const AdminStatisticsSchema = z.object({
    totalUsers: z.number(),
    totalActiveSessions: z.number(),
    newUsersThisMonth: z.number(),
    activeSessionsAverage: z.number(),
});

export const AdminErrorResponses = {
    ...UserErrorResponses,
    403: ErrorResponse,
};

export type AdminUpdateUser = z.infer<typeof AdminUpdateUserSchema>;
export type UserRoleManagement = z.infer<typeof UserRoleManagementSchema>;
export type UserRoleUpdated = z.infer<typeof UserRoleUpdatedSchema>;
export type UserSessionsList = z.infer<typeof UserSessionsListSchema>;
export type DeleteSessionResponse = z.infer<typeof DeleteSessionResponseSchema>;
export type DeleteAllUserSessionsResponse = z.infer<typeof DeleteAllUserSessionsResponseSchema>;
export type AdminStatistics = z.infer<typeof AdminStatisticsSchema>;
