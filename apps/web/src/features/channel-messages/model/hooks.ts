import type { GetChannelMessagesParams, MessageReactionRequest, SendMessageRequest } from "#/shared/api/messages";

import { messagesService } from "#/shared/api/messages";
import { useCallback } from "react";

import { useMessagesStore } from "./store";

export const useChannelMessages = () => {
    const fetchMessages = useMessagesStore(state => state.fetchMessages);
    const setCurrentChannel = useMessagesStore(state => state.setCurrentChannel);
    const currentChannelId = useMessagesStore(state => state.currentChannelId);
    const isLoading = useMessagesStore(state => state.isLoading);
    const nextCursor = useMessagesStore(state => state.nextCursor);

    const getChannelMessages = useCallback(
        async (channelId: string, params?: GetChannelMessagesParams) => {
            try {
                if (channelId !== currentChannelId) {
                    setCurrentChannel(channelId);
                }
                await fetchMessages(channelId, params);
                return true;
            }
            catch {
                return false;
            }
        },
        [fetchMessages, setCurrentChannel, currentChannelId],
    );

    return { getChannelMessages, isLoading, nextCursor };
};

export const useMessageActions = () => {
    const sendMessage = useMessagesStore(state => state.sendMessage);
    const updateMessage = useMessagesStore(state => state.updateMessage);
    const deleteMessage = useMessagesStore(state => state.deleteMessage);
    const addReaction = useMessagesStore(state => state.addReaction);
    const removeReaction = useMessagesStore(state => state.removeReaction);
    const currentChannelId = useMessagesStore(state => state.currentChannelId);

    const handleSendMessage = useCallback(
        async (content: string, attachments: any[] = [], parentMessageId?: string) => {
            if (!currentChannelId)
                return null;

            // Convert attachments to the required format
            const formattedAttachments = attachments.map(file => ({
                fileName: file.name || "",
                fileType: file.type || "",
                size: file.size || 0,
                s3Location: typeof file === "string" ? file : URL.createObjectURL(file),
            }));

            const messageData: SendMessageRequest = {
                content,
                parentMessageId: parentMessageId || null,
                attachments: formattedAttachments.length > 0 ? formattedAttachments : undefined,
            };

            return await sendMessage(currentChannelId, messageData);
        },
        [sendMessage, currentChannelId],
    );

    const handleReplyToMessage = useCallback(
        async (replyToMessageId: string, content: string, attachments: any[] = []) => {
            if (!replyToMessageId) {
                return null;
            }

            // Проверяем, что имеем родительское сообщение локально
            const messagesStore = useMessagesStore.getState();
            const parentMessage = messagesStore.messages.find(msg => msg.id === replyToMessageId);

            if (!parentMessage) {
                try {
                    // Если родительского сообщения нет локально, пробуем загрузить его
                    await messagesService.getMessage(replyToMessageId);
                }
                catch {
                    // Continue even if loading fails
                }
            }

            // Затем отправляем сообщение с указанием родительского
            return handleSendMessage(content, attachments, replyToMessageId);
        },
        [handleSendMessage],
    );

    const handleUpdateMessage = useCallback(
        async (messageId: string, content: string) => {
            return await updateMessage(messageId, content);
        },
        [updateMessage],
    );

    const handleDeleteMessage = useCallback(
        async (messageId: string) => {
            return await deleteMessage(messageId);
        },
        [deleteMessage],
    );

    const handleAddReaction = useCallback(
        async (messageId: string, emoji: string) => {
            const reactionData: MessageReactionRequest = { emoji };
            await addReaction(messageId, reactionData);
        },
        [addReaction],
    );

    const handleRemoveReaction = useCallback(
        async (messageId: string, emoji: string) => {
            await removeReaction(messageId, emoji);
        },
        [removeReaction],
    );

    return {
        sendMessage: handleSendMessage,
        replyToMessage: handleReplyToMessage,
        updateMessage: handleUpdateMessage,
        deleteMessage: handleDeleteMessage,
        addReaction: handleAddReaction,
        removeReaction: handleRemoveReaction,
    };
};
