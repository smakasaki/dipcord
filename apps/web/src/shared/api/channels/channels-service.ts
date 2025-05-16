import type { Channel, ChannelResponse } from "#/entities/channel";

import type { GetChannelMembersParams, GetUserChannelsParams } from "./types";

import { httpClient } from "../http-client";

const mapChannelResponse = (channelData: ChannelResponse): Channel => {
    return {
        ...channelData,
        accessSettings: channelData.accessSettings as Record<string, string> | undefined,
        createdAt: new Date(channelData.createdAt),
        updatedAt: new Date(channelData.updatedAt),
    };
};

type ChannelListResponse = {
    count: number;
    data: ChannelResponse[];
};

type MembersListResponse = {
    count: number;
    data: any[];
};

type ActiveUsersResponse = {
    activeUsers: any[];
};

export const channelsService = {
    getUserChannels: async (params: GetUserChannelsParams = {}) => {
        const defaultParams: Omit<GetUserChannelsParams, "sort"> & { sort?: string } = {
            offset: 0,
            limit: 10,
            sort: "createdAt.desc",
        };

        const queryParams = { ...defaultParams, ...params };
        const stringParams: Record<string, string> = {};

        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    stringParams[key] = value.join(",");
                }
                else {
                    stringParams[key] = String(value);
                }
            }
        });

        const result = await httpClient.get<ChannelListResponse>("/v1/users/me/channels", stringParams);

        return {
            count: result.count || 0,
            data: result.data?.map(mapChannelResponse) || [],
        };
    },

    getChannelMembers: async (channelId: string, params: GetChannelMembersParams = {}) => {
        const defaultParams: Omit<GetChannelMembersParams, "sort"> & { sort?: string } = {
            offset: 0,
            limit: 50,
            sort: "createdAt.desc",
        };

        const queryParams = { ...defaultParams, ...params };
        const stringParams: Record<string, string> = {};

        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined) {
                if (Array.isArray(value)) {
                    stringParams[key] = value.join(",");
                }
                else {
                    stringParams[key] = String(value);
                }
            }
        });

        try {
            const result = await httpClient.get<MembersListResponse>(`/v1/channels/${channelId}/members`, stringParams);

            return {
                count: result.count || 0,
                data: result.data || [],
            };
        }
        catch (error) {
            console.error("Error fetching channel members:", error);
            throw error;
        }
    },

    getChannelActiveUsers: async (channelId: string) => {
        try {
            const result = await httpClient.get<ActiveUsersResponse>(`/v1/channels/${channelId}/active-users`);
            return result.activeUsers || [];
        }
        catch (error) {
            console.error("Error fetching channel active users:", error);
            throw error;
        }
    },
};
