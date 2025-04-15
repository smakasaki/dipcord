import { z } from "zod";

import { StandardErrorResponses } from "../common/index.js";
import { UserResponse } from "../user/response.js";
import { Session } from "./types.js";

export const AuthTokenResponse = z.object({
    accessToken: z.string(),
});

export const SessionsListResponse = z.object({
    sessions: z.array(Session),
});

export const UserSessionsListResponse = z.object({
    userId: z.string().uuid(),
    sessions: z.array(Session),
});

export const DeleteSessionResponse = z.object({
    success: z.boolean(),
    message: z.string(),
});

export const DeleteAllUserSessionsResponse = z.object({
    deletedCount: z.number(),
    message: z.string(),
});

export const LoginResponse = UserResponse;

export const AuthErrorResponses = StandardErrorResponses;
