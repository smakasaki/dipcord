import type { Session } from "../entities/session.js";

export type CreateSessionData = Omit<Session, 'id' | 'createdAt' | 'lastUsedAt'>;
