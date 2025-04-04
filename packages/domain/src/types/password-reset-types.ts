import type { PasswordResetToken } from "../entities/password-reset.js";

export type CreatePasswordResetTokenData = Pick<PasswordResetToken, 'userId' | 'token' | 'expiresAt'>;