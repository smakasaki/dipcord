import type { Message } from "#/entities/message/model";
import type { GetChannelMessagesParams, MessageReactionRequest, SendMessageRequest } from "#/shared/api/messages";

import { mapMessageResponse } from "#/entities/message";
import { useChannelMembersStore } from "#/features/channel-members";
import { messagesService } from "#/shared/api/messages";
import { create } from "zustand";

type MessagesState = {
    messages: Message[];
    totalCount: number;
    isLoading: boolean;
    error: string | null;
    currentChannelId: string | null;
    nextCursor: string | null;

    setCurrentChannel: (channelId: string) => void;
    fetchMessages: (channelId: string, params?: GetChannelMessagesParams) => Promise<void>;
    sendMessage: (channelId: string, messageData: SendMessageRequest) => Promise<Message | null>;
    updateMessage: (messageId: string, content: string) => Promise<Message | null>;
    deleteMessage: (messageId: string) => Promise<boolean>;
    addReaction: (messageId: string, reactionData: MessageReactionRequest) => Promise<void>;
    removeReaction: (messageId: string, emoji: string) => Promise<void>;
    setError: (error: string | null) => void;
};

export const useMessagesStore = create<MessagesState>(set => ({
    messages: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    currentChannelId: null,
    nextCursor: null,

    setCurrentChannel: (channelId) => {
        set({ currentChannelId: channelId, messages: [], totalCount: 0 });
    },

    setError: error => set({ error }),

    fetchMessages: async (channelId, params) => {
        set({ isLoading: true, error: null });

        try {
            const { count, data, nextCursor } = await messagesService.getChannelMessages(channelId, params);

            // Первичное преобразование сообщений
            let mappedMessages = data.map((message: any) => {
                return mapMessageResponse(message);
            });

            // После первичного маппинга собираем ID сообщений, для которых нужны родительские сообщения
            const parentMessageIds = new Set<string>();
            mappedMessages.forEach((msg) => {
                if (msg.replyToId && !msg.replyTo) {
                    parentMessageIds.add(msg.replyToId);
                }
            });

            // Если есть родительские сообщения для подгрузки
            if (parentMessageIds.size > 0) {
                const parentMessages = new Map<string, Message>();

                // Загружаем каждое родительское сообщение
                await Promise.all(Array.from(parentMessageIds).map(async (msgId) => {
                    try {
                        const messageData = await messagesService.getMessage(msgId);
                        if (messageData) {
                            // Проверим структуру данных и используем поле message, если оно есть
                            const dataToMap = messageData.message || messageData;
                            const parentMsg = mapMessageResponse(dataToMap);
                            parentMessages.set(msgId, parentMsg);
                        }
                    }
                    catch {
                        // Создаем заглушку для недоступного сообщения
                        // Пытаемся получить информацию о пользователе из данных пользователей
                        const userStore = useChannelMembersStore.getState();
                        const userInfo = userStore.users[msgId];

                        // Создаем placeholder сообщение для недоступного родительского сообщения
                        const placeholderMsg: Message = {
                            id: msgId,
                            content: "Сообщение недоступно",
                            author: {
                                id: msgId,
                                username: userInfo?.username || `User_${msgId.substring(0, 5)}`,
                                name: userInfo?.name || "",
                                surname: userInfo?.surname || "",
                            },
                            channelId,
                            timestamp: new Date(),
                            isEdited: false,
                            attachments: [],
                            reactions: [],
                            isUnavailable: true,
                        };

                        parentMessages.set(msgId, placeholderMsg);
                    }
                }));

                // Обновляем сообщения, связывая их с родительскими
                if (parentMessages.size > 0) {
                    mappedMessages = mappedMessages.map((msg) => {
                        if (msg.replyToId && !msg.replyTo && parentMessages.has(msg.replyToId)) {
                            const parentMsg = parentMessages.get(msg.replyToId);
                            return {
                                ...msg,
                                replyTo: parentMsg,
                            };
                        }
                        return msg;
                    });
                }
            }

            // Сортировка сообщений по времени (от старых к новым, как в чате)
            mappedMessages.sort((a: Message, b: Message) =>
                a.timestamp.getTime() - b.timestamp.getTime());

            set((state) => {
                // Определяем, загружаем ли мы более старые сообщения (пагинация вверх)
                const isLoadingOlder = params?.cursor !== undefined;

                // Если загружаем более старые сообщения при скролле вверх,
                // добавляем их в начало списка
                const messages = isLoadingOlder
                    ? [...mappedMessages, ...state.messages]
                    : mappedMessages;

                // Убираем дубликаты по ID
                const uniqueMessages = Array.from(
                    new Map(messages.map(msg => [msg.id, msg])).values(),
                );

                // Сортируем снова после объединения (от старых к новым)
                uniqueMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

                // Проверяем, есть ли сообщения, которые раньше были плейсхолдерами (unavailable)
                // и заменяем ссылки на них в других сообщениях на реальные данные
                const realMessagesMap = new Map<string, Message>();
                uniqueMessages.forEach((msg) => {
                    // Если это реальное сообщение (не placeholder) - добавляем в карту
                    if (!msg.isUnavailable) {
                        realMessagesMap.set(msg.id, msg);
                    }
                });

                // Обновляем все ссылки на placeholder-сообщения, если у нас уже есть реальное
                const updatedMessages = uniqueMessages.map((msg) => {
                    // Если у сообщения есть replyTo с isUnavailable, но уже есть реальное сообщение
                    if (msg.replyTo?.isUnavailable && realMessagesMap.has(msg.replyTo.id)) {
                        const realMessage = realMessagesMap.get(msg.replyTo.id);
                        if (realMessage) {
                            return {
                                ...msg,
                                replyTo: realMessage,
                            };
                        }
                    }
                    return msg;
                });

                return {
                    messages: updatedMessages,
                    totalCount: count,
                    isLoading: false,
                    currentChannelId: channelId,
                    nextCursor,
                };
            });
        }
        catch (error) {
            set({
                isLoading: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to fetch messages.",
            });
            throw error;
        }
    },

    sendMessage: async (channelId, messageData) => {
        // If this is a reply to a message (has a parentMessageId)
        let parentMessage = null;
        if (messageData.parentMessageId) {
            // Check if we already have the parent message in the store
            parentMessage = useMessagesStore.getState().messages.find(msg => msg.id === messageData.parentMessageId);

            if (!parentMessage) {
                try {
                    // Attempt to fetch the parent message from the API
                    const parentResponse = await messagesService.getMessage(messageData.parentMessageId);
                    if (parentResponse) {
                        parentMessage = mapMessageResponse(parentResponse);
                    }
                }
                catch {
                    // Continue sending the message even if we couldn't fetch the parent
                }
            }
        }

        set({ isLoading: true });

        try {
            const response = await messagesService.sendMessage(channelId, messageData);

            // Map the response to our internal message format
            const message = mapMessageResponse(response);

            // If this was a reply and we still don't have the parent message loaded,
            // try one more time to load it
            if (messageData.parentMessageId && message.replyToId && !message.replyTo) {
                try {
                    const parentResponse = await messagesService.getMessage(messageData.parentMessageId);
                    if (parentResponse) {
                        // Update the message with the parent info
                        message.replyTo = mapMessageResponse(parentResponse);
                    }
                }
                catch {
                    // Create a placeholder for the unavailable message
                    message.replyTo = {
                        id: messageData.parentMessageId,
                        content: "Сообщение недоступно",
                        author: {
                            id: messageData.parentMessageId,
                            username: `User_${messageData.parentMessageId.substring(0, 5)}`,
                            // Try to get user info from the members store if available
                            name: "",
                            surname: "",
                        },
                        channelId,
                        timestamp: new Date(),
                        isEdited: false,
                        attachments: [],
                        reactions: [],
                        isUnavailable: true,
                    };
                }
            }

            // Add the new message to the store
            set(state => ({
                messages: [message, ...state.messages],
                totalCount: state.totalCount + 1,
                isLoading: false,
            }));

            return message;
        }
        catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    updateMessage: async (messageId, content) => {
        try {
            const response = await messagesService.updateMessage(messageId, content);
            
            // Update the message in the store
            set(state => {
                const updatedMessages = state.messages.map(msg => {
                    if (msg.id === messageId) {
                        return {
                            ...msg,
                            content,
                            isEdited: true,
                        };
                    }
                    return msg;
                });
                
                return {
                    ...state,
                    messages: updatedMessages,
                };
            });
            
            // Return the updated message
            return mapMessageResponse(response);
        } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to update message." });
            throw error;
        }
    },
    
    deleteMessage: async (messageId) => {
        try {
            await messagesService.deleteMessage(messageId);
            
            // Remove the message from the store
            set(state => {
                const filteredMessages = state.messages.filter(msg => msg.id !== messageId);
                
                return {
                    ...state,
                    messages: filteredMessages,
                };
            });
            
            return true;
        } catch (error) {
            set({ error: error instanceof Error ? error.message : "Failed to delete message." });
            throw error;
        }
    },

    addReaction: async (messageId, reactionData) => {
        try {
            await messagesService.addReaction(messageId, reactionData);

            // Optimistic update (in a real app, you might want to refresh the message)
            set(state => ({
                messages: state.messages.map((msg) => {
                    if (msg.id === messageId) {
                        const existingReaction = msg.reactions.find(r => r.emoji === reactionData.emoji);
                        if (existingReaction) {
                            return {
                                ...msg,
                                reactions: msg.reactions.map(r =>
                                    r.emoji === reactionData.emoji
                                        ? { ...r, count: r.count + 1, users: [...r.users, "current-user"] }
                                        : r,
                                ),
                            };
                        }
                        else {
                            return {
                                ...msg,
                                reactions: [...msg.reactions, { emoji: reactionData.emoji, count: 1, users: ["current-user"] }],
                            };
                        }
                    }
                    return msg;
                }),
            }));
        }
        catch (error) {
            set({
                error: error instanceof Error
                    ? error.message
                    : "Failed to add reaction.",
            });
        }
    },

    removeReaction: async (messageId, emoji) => {
        try {
            await messagesService.removeReaction(messageId, emoji);

            // Optimistic update
            set(state => ({
                messages: state.messages.map((msg) => {
                    if (msg.id === messageId) {
                        return {
                            ...msg,
                            reactions: msg.reactions
                                .map(r => r.emoji === emoji
                                    ? { ...r, count: r.count - 1, users: r.users.filter(u => u !== "current-user") }
                                    : r,
                                )
                                .filter(r => r.count > 0),
                        };
                    }
                    return msg;
                }),
            }));
        }
        catch (error) {
            set({
                error: error instanceof Error
                    ? error.message
                    : "Failed to remove reaction.",
            });
        }
    },
}));
