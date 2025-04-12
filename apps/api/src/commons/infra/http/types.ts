import type {
    FastifyBaseLogger,
    FastifyInstance,
    FastifyPluginCallback,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
} from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

/**
 * Type definition for Fastify plugin callback that uses Zod for validation and serialization
 */
export type FastifyPluginCallbackZod = FastifyPluginCallback<
    Record<never, never>
>;

/**
 * Helper type for Fastify instance with Zod type provider
 */
export type FastifyZod = FastifyInstance<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    FastifyBaseLogger,
    ZodTypeProvider
>;
