import type { Channel, ChannelResponse } from "#/entities/channel";

import type { GetChannelMembersParams, GetUserChannelsParams } from "./types";

import { GET } from "../client";

const mapChannelResponse = (channelData: ChannelResponse): Channel => {
    return {
        ...channelData,
        createdAt: new Date(channelData.createdAt),
        updatedAt: new Date(channelData.updatedAt),
    };
};

export const channelsService = {
    getUserChannels: async (params: GetUserChannelsParams = {}) => {
        const defaultParams: GetUserChannelsParams = {
            offset: 0,
            limit: 10,
            sort: ["createdAt.desc"],
        };

        const queryParams = { ...defaultParams, ...params };

        const result = await GET("/v1/users/me/channels", {
            params: {
                query: queryParams,
            },
        });

        if (result.error) {
            throw result.error;
        }

        return {
            count: result.data?.count || 0,
            data: result.data?.data?.map(mapChannelResponse) || [],
        };
    },

    getChannelMembers: async (channelId: string, params: GetChannelMembersParams = {}) => {
        const defaultParams: GetChannelMembersParams = {
            offset: 0,
            limit: 50, // Увеличиваем лимит, чтобы получить больше пользователей сразу
            sort: ["createdAt.desc"],
        };

        const queryParams = { ...defaultParams, ...params };

        const result = await GET("/v1/channels/{channelId}/members", {
            params: {
                path: { channelId },
                query: queryParams,
            },
        });

        if (result.error) {
            console.error("Error fetching channel members:", result.error);
            throw result.error;
        }

        return {
            count: result.data?.count || 0,
            data: result.data?.data || [],
        };
    },
};
