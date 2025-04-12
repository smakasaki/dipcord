import { z } from "zod";

import { UUID } from "../common/index.js";

export const LoginRequest = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const SessionIdParam = z.object({
    sessionId: UUID,
});

export const RequestPasswordResetRequest = z.object({
    email: z.string().email(),
});

export const ResetPasswordRequest = z.object({
    token: z.string(),
    password: z.string().min(8),
});

export const ChangePasswordRequest = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
});
