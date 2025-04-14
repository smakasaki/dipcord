import type { paths } from "../types/api";
import type { MessageReactionRequest, SendMessageRequest } from "./types";

import { DELETE, GET, POST, PUT } from "../client";

// Get the types directly from the generated paths
type _GetChannelMessagesResponse = paths["/v1/channels/{channelId}/messages"]["get"]["responses"]["200"]["content"]["application/json"];
type GetChannelMessagesParams = paths["/v1/channels/{channelId}/messages"]["get"]["parameters"]["query"];

export const messagesService = {
    getChannelMessages: async (channelId: string, params: GetChannelMessagesParams = {}) => {
        const defaultParams: GetChannelMessagesParams = {
            limit: 20,
            sort: "newest",
        };

        const queryParams = { ...defaultParams, ...params };

        const result = await GET("/v1/channels/{channelId}/messages", {
            params: {
                path: { channelId },
                query: queryParams,
            },
        });

        if (result.error) {
            throw result.error;
        }

        // Получаем курсор из заголовка ответа
        const nextCursor = result.response?.headers?.get("x-next-cursor") || null;

        return {
            count: result.data?.count || 0,
            data: result.data?.data || [],
            nextCursor,
        };
    },

    sendMessage: async (channelId: string, messageData: SendMessageRequest) => {
        const result = await POST("/v1/channels/{channelId}/messages", {
            params: {
                path: { channelId },
            },
            body: messageData,
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    getReplies: async (messageId: string) => {
        const result = await GET("/v1/messages/{messageId}/replies", {
            params: {
                path: { messageId },
            },
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    getMessage: async (messageId: string) => {
        const result = await GET("/v1/messages/{messageId}", {
            params: {
                path: { messageId },
            },
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    updateMessage: async (messageId: string, content: string) => {
        const result = await PUT("/v1/messages/{messageId}", {
            params: {
                path: { messageId },
            },
            body: { content },
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    deleteMessage: async (messageId: string) => {
        const result = await DELETE("/v1/messages/{messageId}", {
            params: {
                path: { messageId },
            },
        });

        if (result.error) {
            throw result.error;
        }

        return true;
    },

    addReaction: async (messageId: string, reactionData: MessageReactionRequest) => {
        const result = await POST("/v1/messages/{messageId}/reactions", {
            params: {
                path: { messageId },
            },
            body: reactionData,
        });

        if (result.error) {
            throw result.error;
        }

        return result.data;
    },

    removeReaction: async (messageId: string, emoji: string) => {
        const result = await DELETE("/v1/messages/{messageId}/reactions/{emoji}", {
            params: {
                path: { messageId, emoji },
            },
        });

        if (result.error) {
            throw result.error;
        }

        return true;
    },
};
