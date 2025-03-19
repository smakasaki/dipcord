/* eslint-disable ts/consistent-type-definitions */
import type { OAuth2Namespace } from "@fastify/oauth2";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type {
    ContextConfigDefault,
    FastifyBaseLogger,
    FastifyInstance,
    FastifyReply,
    FastifyRequest,
    FastifySchema,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
    RouteGenericInterface,
} from "fastify";

import type { Database } from "#commons/infra/plugins/database.js";
import type { SessionService } from "#users/app/session-service.js";
import type { UserService } from "#users/app/user-service.js";

declare module "fastify" {
    interface FastifyInstance {
        db: Database;
        authTokenService: AuthTokenService;
        authenticate: (request: FastifyRequest) => Promise<void>;
        authenticateAdmin: (request: FastifyRequest) => Promise<void>;
        userService: UserService;
        sessionService: SessionService;
        googleOAuth2: OAuth2Namespace;
        microsoftOAuth2: OAuth2Namespace;
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
    interface RouteOptions {
        config?: {
            auth?: boolean;
            adminAuth?: boolean;
        };
    }

}

export type FastifyTypeBox = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    FastifyBaseLogger,
    TypeBoxTypeProvider
>;

/*
How to use request & reply args:
const CreateProductHandler = (
    req: FastifyRequestTypeBox<typeof CreateProductSchema>,
    reply: FastifyReplyTypeBox<typeof CreateProductSchema>,
)
*/
export type FastifyRequestTypeBox<TSchema extends FastifySchema> = FastifyRequest<
    RouteGenericInterface,
    RawServerDefault,
    RawRequestDefaultExpression,
    TSchema,
    TypeBoxTypeProvider
>;

export type FastifyReplyTypeBox<TSchema extends FastifySchema> = FastifyReply<
    RouteGenericInterface,
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    ContextConfigDefault,
    TSchema,
    TypeBoxTypeProvider
>;
