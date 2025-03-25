import type { FastifyPluginAsync } from "fastify";

import fp from "fastify-plugin";

import { ActiveUsersService } from "#channels/app/active-users-service.js";
import { ChannelService } from "#channels/app/channel-service.js";

import { ChannelDao } from "../dao/channel-dao.js";
import { ChannelInviteDao } from "../dao/channel-invite-dao.js";
import { ChannelMemberDao } from "../dao/channel-member-dao.js";

const channelServicesPlugin: FastifyPluginAsync = async (fastify) => {
    if (!fastify.db) {
        throw new Error("Database not found. Make sure it is registered before the channel services plugin.");
    }

    if (!fastify.redis) {
        throw new Error("Redis not found. Make sure it is registered before the channel services plugin.");
    }

    const channelRepository = new ChannelDao(fastify.db);
    const channelMemberRepository = new ChannelMemberDao(fastify.db);
    const channelInviteRepository = new ChannelInviteDao(fastify.db);

    const activeUsersService = new ActiveUsersService(fastify.redis);

    const channelService = new ChannelService(
        channelRepository,
        channelMemberRepository,
        channelInviteRepository,
        activeUsersService,
    );

    fastify.decorate("channelService", channelService);
    fastify.decorate("activeUsersService", activeUsersService);
    fastify.log.info("Channel services registered");
};

export default fp(channelServicesPlugin, {
    name: "channel-services",
    dependencies: ["database", "redis"],
});
