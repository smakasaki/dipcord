import { Type } from "@sinclair/typebox";

import { StandardErrorResponses } from "../common/index.js";
import { UserResponse } from "../user/response.js";
import { Session } from "./types.js";

export const AuthTokenResponse = Type.Object({
    accessToken: Type.String(),
});

export const SessionsListResponse = Type.Object({
    sessions: Type.Array(Session),
});

export const UserSessionsListResponse = Type.Object({
    userId: Type.String({ format: "uuid" }),
    sessions: Type.Array(Session),
});

export const DeleteSessionResponse = Type.Object({
    success: Type.Boolean(),
    message: Type.String(),
});

export const DeleteAllUserSessionsResponse = Type.Object({
    deletedCount: Type.Number(),
    message: Type.String(),
});

export const LoginResponse = UserResponse;

export const AuthErrorResponses = StandardErrorResponses;
