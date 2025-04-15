import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
    AddMemberRequest,
    ChannelErrorResponses,
    ChannelIdParam,
    ChannelResponse,
    CreateChannelRequest,
    CreateInviteRequest,
    InviteIdParam,
    InviteResponse,
    MemberIdParam,
    MemberResponse,
    NoContent,
    PaginatedChannelsResponse,
    PaginatedInvitesResponse,
    PaginatedMembersResponse,
    Pagination,
    SortQuery,
    UpdateChannelRequest,
    UpdateMemberPermissionsRequest,
    UpdateMemberRoleRequest,
} from "@dipcord/schema";
import { z } from "zod";

import { mapChannelInviteToResponse, mapChannelMemberToResponse, mapChannelToResponse } from "#channels/infra/utils/channel-mapper.js";
import { decodeSort, validateSortFields } from "#commons/infra/http/utils/decode-sort.js";

/**
 * Channel routes
 */
const routes: FastifyPluginAsyncZod = async function (fastify): Promise<void> {
    /**
     * Get channels where the current user is a member
     */
    fastify.get("/users/me/channels", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Users"],
            description: "Get channels where the authenticated user is a member",
            querystring: Pagination.merge(SortQuery),
            response: {
                200: PaginatedChannelsResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;

        const validSortFields = ["id", "name", "createdAt", "updatedAt"];
        const validatedSort = validateSortFields(sort || ["createdAt.desc"], validSortFields);

        const result = await fastify.channelService.getUserChannels(
            request.user!.id,
            { offset: offset ?? 0, limit: limit ?? 20 },
            decodeSort(validatedSort),
        );

        return {
            count: result.count,
            data: result.data.map(mapChannelToResponse),
        };
    });

    /**
     * Create new channel
     */
    fastify.post("/channels", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels"],
            description: "Create a new channel",
            body: CreateChannelRequest,
            response: {
                201: ChannelResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { channel } = await fastify.channelService.createChannel(
            request.body,
            request.user!.id,
        );

        return reply.status(201).send(mapChannelToResponse(channel));
    });

    /**
     * Get all channels
     */
    fastify.get("/channels", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels"],
            description: "Get all channels with pagination and sorting",
            querystring: Pagination.merge(SortQuery),
            response: {
                200: PaginatedChannelsResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;

        const validSortFields = ["id", "name", "createdAt", "updatedAt"];
        const validatedSort = validateSortFields(sort || ["createdAt.desc"], validSortFields);

        const result = await fastify.channelService.getAllChannels(
            { offset: offset ?? 0, limit: limit ?? 20 },
            decodeSort(validatedSort),
        );

        return {
            count: result.count,
            data: result.data.map(mapChannelToResponse),
        };
    });

    /**
     * Get channel by ID
     */
    fastify.get("/channels/:channelId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels"],
            description: "Get channel by ID",
            params: ChannelIdParam,
            response: {
                200: ChannelResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const channel = await fastify.channelService.getChannelById(request.params.channelId);
        return mapChannelToResponse(channel);
    });

    /**
     * Update channel
     */
    fastify.put("/channels/:channelId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels"],
            description: "Update channel",
            params: ChannelIdParam,
            body: UpdateChannelRequest,
            response: {
                200: ChannelResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const updatedChannel = await fastify.channelService.updateChannel(
            request.params.channelId,
            request.body,
            request.user!.id,
        );

        return mapChannelToResponse(updatedChannel);
    });

    /**
     * Delete channel
     */
    fastify.delete("/channels/:channelId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels"],
            description: "Delete channel",
            params: ChannelIdParam,
            response: {
                204: NoContent,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        await fastify.channelService.deleteChannel(
            request.params.channelId,
            request.user!.id,
        );

        return reply.status(204).send();
    });

    /**
     * Get channel members
     */
    fastify.get("/channels/:channelId/members", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Members"],
            description: "Get channel members with pagination and sorting",
            params: ChannelIdParam,
            querystring: Pagination.merge(SortQuery),
            response: {
                200: PaginatedMembersResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;

        const validSortFields = ["id", "role", "joinedAt", "userId"];
        const validatedSort = validateSortFields(sort || ["joinedAt.asc"], validSortFields);

        const result = await fastify.channelService.getChannelMembers(
            request.params.channelId,
            { offset: offset ?? 0, limit: limit ?? 25 },
            decodeSort(validatedSort),
        );

        return {
            count: result.count,
            data: result.data.map(mapChannelMemberToResponse),
        };
    });

    /**
     * Add member to channel
     */
    fastify.post("/channels/:channelId/members", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Members"],
            description: "Add member to channel",
            params: ChannelIdParam,
            body: AddMemberRequest,
            response: {
                201: MemberResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const member = await fastify.channelService.addMember(
            request.params.channelId,
            {
                userId: request.body.userId,
                role: request.body.role === "owner" ? "user" : request.body.role,
            },
            request.user!.id,
        );

        return reply.status(201).send(mapChannelMemberToResponse(member));
    });

    /**
     * Get member by ID
     */
    fastify.get("/channels/members/:memberId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Members"],
            description: "Get channel member by ID",
            params: MemberIdParam,
            response: {
                200: MemberResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const member = await fastify.channelService.getMemberById(request.params.memberId);
        return mapChannelMemberToResponse(member);
    });

    /**
     * Update member role
     */
    fastify.put("/channels/members/:memberId/role", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Members"],
            description: "Update channel member role",
            params: MemberIdParam,
            body: UpdateMemberRoleRequest,
            response: {
                200: MemberResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const updatedMember = await fastify.channelService.updateMember(
            request.params.memberId,
            { role: request.body.role },
            request.user!.id,
        );

        return mapChannelMemberToResponse(updatedMember);
    });

    /**
     * Update member permissions
     */
    fastify.put("/channels/members/:memberId/permissions", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Members"],
            description: "Update channel member permissions",
            params: MemberIdParam,
            body: UpdateMemberPermissionsRequest,
            response: {
                200: MemberResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const updatedMember = await fastify.channelService.updateMember(
            request.params.memberId,
            { permissions: request.body.permissions },
            request.user!.id,
        );

        return mapChannelMemberToResponse(updatedMember);
    });

    /**
     * Remove member from channel
     */
    fastify.delete("/channels/members/:memberId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Members"],
            description: "Remove member from channel",
            params: MemberIdParam,
            response: {
                204: NoContent,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        await fastify.channelService.removeMember(
            request.params.memberId,
            request.user!.id,
        );

        return reply.status(204).send();
    });

    /**
     * Get channel invites
     */
    fastify.get("/channels/:channelId/invites", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Invites"],
            description: "Get channel invites with pagination and sorting",
            params: ChannelIdParam,
            querystring: Pagination.merge(SortQuery),
            response: {
                200: PaginatedInvitesResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const { offset, limit, sort } = request.query;

        const validSortFields = ["id", "createdAt", "expiresAt", "isUsed"];
        const validatedSort = validateSortFields(sort || ["createdAt.desc"], validSortFields);

        const result = await fastify.channelService.getChannelInvites(
            request.params.channelId,
            request.user!.id,
            { offset: offset ?? 0, limit: limit ?? 10 },
            decodeSort(validatedSort),
        );

        return {
            count: result.count,
            data: result.data.map(mapChannelInviteToResponse),
        };
    });

    /**
     * Create channel invite
     */
    fastify.post("/channels/:channelId/invites", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Invites"],
            description: "Create channel invite",
            params: ChannelIdParam,
            body: CreateInviteRequest,
            response: {
                201: InviteResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const invite = await fastify.channelService.createInvite(
            request.params.channelId,
            {
                email: request.body.email,
                expiresAt: request.body.expiresAt ? new Date(request.body.expiresAt) : undefined,
            },
            request.user!.id,
        );

        return reply.status(201).send(mapChannelInviteToResponse(invite));
    });

    /**
     * Delete channel invite
     */
    fastify.delete("/channels/invites/:inviteId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Invites"],
            description: "Delete channel invite",
            params: InviteIdParam,
            response: {
                204: NoContent,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        await fastify.channelService.deleteInvite(
            request.params.inviteId,
            request.user!.id,
        );

        return reply.status(204).send();
    });

    /**
     * Accept channel invite
     */
    fastify.post("/channels/invites/accept", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Invites"],
            description: "Accept channel invite",
            body: z.object({
                inviteCode: z.string(),
            }),
            response: {
                200: MemberResponse,
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const member = await fastify.channelService.acceptInvite(
            request.body.inviteCode,
            request.user!.id,
        );

        return mapChannelMemberToResponse(member);
    });

    /**
     * Get active users in channel
     */
    fastify.get("/channels/:channelId/active-users", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Channels", "Activity"],
            description: "Get active users in channel",
            params: ChannelIdParam,
            response: {
                200: z.object({
                    activeUsers: z.array(z.string().uuid()),
                }),
                ...ChannelErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request) => {
        const activeUsers = await fastify.channelService.getActiveUsers(
            request.params.channelId,
        );

        return { activeUsers };
    });
};

export default routes;
