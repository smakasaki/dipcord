// apps/api/src/users/infra/plugins/user-activity-tracker.ts
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import fp from "fastify-plugin";

import { UserActivityService } from "../services/user-activity-service.js";

/**
 * User Activity Tracker Plugin
 *
 * Automatically tracks user activity after successful authentication
 * and updates the user's online status in Redis.
 */
const userActivityTrackerPlugin: FastifyPluginAsync = async (fastify) => {
    // Create the UserActivityService
    const userActivityService = new UserActivityService(fastify.redis);

    // Decorate fastify with the service
    fastify.decorate("userActivityService", userActivityService);

    // Add a global onRoute hook to add our activity tracker to authenticated routes
    fastify.addHook("onRoute", (routeOptions) => {
        if (routeOptions.config?.auth === true) {
            const preHandler = routeOptions.preHandler;

            // Get existing preHandlers or create empty array
            const handlers = preHandler
                ? Array.isArray(preHandler)
                    ? [...preHandler]
                    : [preHandler]
                : [];

            // Add our activity tracker after authentication
            const trackActivity = async (request: FastifyRequest) => {
                if (!request.user?.id) {
                    return;
                }

                // Update user activity status
                fastify.log.info(`Marking user ${request.user.id} as active`);
                try {
                    await userActivityService.markUserActive(request.user.id);
                    const count = await userActivityService.countActiveUsers();
                    fastify.log.info(`Successfully marked user as active. Total active users: ${count}`);
                }
                catch (error) {
                    fastify.log.error(error, `Failed to mark user ${request.user.id} as active`);
                }
            };

            // Add our tracker after existing handlers
            handlers.push(trackActivity);

            // Update route preHandlers
            routeOptions.preHandler = handlers;
        }
    });

    // Update websocket status as well
    if (fastify.io) {
        fastify.io.on("connection", async (socket: any) => {
            // Mark user as active when they connect via WebSocket
            if (socket.data?.user?.id) {
                await userActivityService.markUserActive(socket.data.user.id);
            }

            // Listen for disconnect events
            socket.on("disconnect", async () => {
                if (socket.data?.user?.id) {
                    // Delay marking as inactive to allow for reconnections
                    setTimeout(async () => {
                        // Check if user has reconnected
                        const isActive = await fastify.io.sockets.adapter.rooms.has(`user:${socket.data.user.id}`);
                        if (!isActive) {
                            await userActivityService.markUserInactive(socket.data.user.id);
                        }
                    }, 10000); // 10 second delay
                }
            });
        });
    }

    // Cleanup job for expired activity data
    const ONE_HOUR = 60 * 60 * 1000;
    setInterval(async () => {
        try {
            const now = Date.now();
            const threshold = now - (1800 * 1000);
            await userActivityService.cleanupExpiredActivity(threshold);
            fastify.log.debug("Cleaned up expired user activity data");
        }
        catch (error) {
            fastify.log.error(error, "Error cleaning up expired user activity data");
        }
    }, ONE_HOUR);

    fastify.log.info("User activity tracker plugin registered");
};

// Add type declarations
declare module "fastify" {
    // eslint-disable-next-line ts/consistent-type-definitions
    interface FastifyInstance {
        userActivityService: UserActivityService;
    }
}

// Export the plugin properly wrapped with fastify-plugin
export default fp(userActivityTrackerPlugin, {
    name: "user-activity-tracker",
    dependencies: ["redis", "auth"],
});
