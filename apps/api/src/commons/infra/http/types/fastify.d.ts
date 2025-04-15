/* eslint-disable ts/consistent-type-definitions */
import type { OAuth2Namespace } from "@fastify/oauth2";
import type {
    FastifyBaseLogger,
    FastifyInstance,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
} from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { RedisClientType } from "redis";

import type { ActiveUsersService } from "#channels/app/active-users-service.js";
import type { ChannelService } from "#channels/app/channel-service.js";
import type { ChatService } from "#chat/app/chat-service.js";
import type { Database } from "#commons/infra/plugins/database.js";
import type { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from "#commons/infra/ws/types.js";
import type { SessionService } from "#users/app/session-service.js";
import type { UserService } from "#users/app/user-service.js";

declare module "fastify" {
    interface FastifyInstance {
        db: Database;
        redis: RedisClientType<RedisDefaultModules & RedisFunctions & RedisScripts>;
        authTokenService: AuthTokenService;
        authenticate: (request: FastifyRequest) => Promise<void>;
        authenticateAdmin: (request: FastifyRequest) => Promise<void>;
        userService: UserService;
        channelService: ChannelService;
        sessionService: SessionService;
        activeUsersService: ActiveUsersService;
        googleOAuth2: OAuth2Namespace;
        microsoftOAuth2: OAuth2Namespace;
        chatService: ChatService;

        io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
        broadcastToChannel: (channelId: string, event: string, ...args: any[]) => void;
        broadcastToUser: (userId: string, event: string, ...args: any[]) => void;
    }
    interface FastifyRequest {
        user?: {
            id: string;
            email: string;
            name: string;
            surname: string;
            sessionId: string;
            [key: string]: unknown;
        };
    }
    interface FastifyContextConfig {
        auth?: boolean;
        adminAuth?: boolean;
    }
}

export type FastifyZod = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyBaseLogger,
    ZodTypeProvider
>;
