import { Type } from "@sinclair/typebox";

import { UUID } from "../common/index.js";

export const LoginRequest = Type.Object({
    email: Type.String({ format: "email" }),
    password: Type.String(),
});

export const SessionIdParam = Type.Object({
    sessionId: UUID,
});

export const RequestPasswordResetRequest = Type.Object({
    email: Type.String({ format: "email" }),
});

export const ResetPasswordRequest = Type.Object({
    token: Type.String(),
    password: Type.String({ minLength: 8 }),
});

export const ChangePasswordRequest = Type.Object({
    currentPassword: Type.String(),
    newPassword: Type.String({ minLength: 8 }),
});
