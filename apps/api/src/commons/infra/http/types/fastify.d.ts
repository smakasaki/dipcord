/* eslint-disable ts/consistent-type-definitions */
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

declare module "fastify" {
    interface FastifyInstance {
        db: Database;
        authTokenService: AuthTokenService;
        authenticate: (request: FastifyRequest) => Promise<void>;
        userService: UserService;
    }
    interface FastifyRequest {
        user?: {
            id: string;
            email: string;
            name: string;
            surname: string;
            [key: string]: unknown;
        };
    }
    interface RouteOptions {
        config?: {
            auth?: boolean;
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
