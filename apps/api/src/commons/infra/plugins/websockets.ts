import type { FastifyPluginAsync } from "fastify";
import type { FastifySocketioOptions } from "fastify-socket.io";
import type { ExtendedError } from "socket.io";

import multipart from "@fastify/multipart";
import fp from "fastify-plugin";
import fasifySocketIo from "fastify-socket.io";

import { buildSessionConfig } from "#users/config/session-config.js";

import type { SocketType } from "../ws/types.js";

import { registerSocketHandlers } from "../ws/socket-handlers.js";

const socketioServer = fasifySocketIo as unknown as FastifyPluginAsync<FastifySocketioOptions>;

/**
 * WebSocket plugin for Fastify
 *
 * This plugin sets up Socket.IO with the Fastify server
 */
const websocketPlugin: FastifyPluginAsync = async (fastify) => {
    const { cookieName } = buildSessionConfig();

    await fastify.register(socketioServer, {
        cors: {
            // eslint-disable-next-line node/no-process-env
            origin: process.env.CORS_ORIGIN || true,
            methods: ["GET", "POST"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
        pingInterval: 10000,
        pingTimeout: 5000,
    });

    await fastify.register(multipart, {
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB max file size
            files: 10, // Allow up to 10 files per request
        },
    });

    // Setup connection handling
    fastify.addHook("onReady", () => {
        // Configure authentication middleware
        fastify.io.use(async (socket: SocketType, next: (err?: Error | ExtendedError) => void) => {
            try {
                // Get session cookie from handshake headers
                const cookies = socket.handshake.headers.cookie;
                if (!cookies) {
                    return next(new Error("No session cookie found"));
                }

                // Parse cookies to get the session token
                const cookieMap = parseCookies(cookies);
                const sessionToken = cookieMap[cookieName];

                if (!sessionToken) {
                    return next(new Error("No session token found"));
                }

                // Validate session token
                const session = await fastify.sessionService.getSessionByToken(sessionToken);
                if (!session) {
                    return next(new Error("Invalid session"));
                }

                // Get user from session
                const user = await fastify.userService.findById(session.userId);
                if (!user) {
                    return next(new Error("User not found"));
                }

                // Update session last used
                await fastify.sessionService.updateLastUsed(session.id);

                // Attach user and session info to socket data
                socket.data.user = {
                    id: user.id,
                    username: user.username,
                    name: user.name,
                    surname: user.surname,
                };
                socket.data.sessionId = session.id;
                socket.data.authenticated = true;
                socket.data.joinedChannels = [];

                return next();
            }
            catch (err) {
                fastify.log.error(err, "Socket authentication error");
                return next(new Error("Authentication error"));
            }
        });

        // Register all socket event handlers
        registerSocketHandlers(fastify);
    });

    // Decorate fastify with WS-related methods
    fastify.decorate("broadcastToChannel", (channelId: string, event: string, ...args: any[]) => {
        fastify.io.to(`channel:${channelId}`).emit(event, ...args);
    });

    fastify.decorate("broadcastToUser", (userId: string, event: string, ...args: any[]) => {
        fastify.io.to(`user:${userId}`).emit(event, ...args);
    });

    // Close WebSocket server on Fastify close
    fastify.addHook("onClose", (instance, done) => {
        instance.io.close();
        done();
    });
};

/**
 * Parse cookie string into key-value map
 * @param cookieString Cookie header string
 * @returns Map of cookie names to values
 */
function parseCookies(cookieString: string): Record<string, string> {
    return cookieString
        .split(";")
        .map(v => v.split("="))
        .reduce((acc, parts) => {
            if (parts.length >= 2 && parts[0] !== undefined && parts[1] !== undefined) {
                const key = parts[0].trim();
                const value = parts[1];
                acc[key] = decodeURIComponent(value);
            }
            return acc;
        }, {} as Record<string, string>);
}

export default fp(websocketPlugin, {
    name: "websocket",
    dependencies: ["database", "redis", "user-services"],
});
