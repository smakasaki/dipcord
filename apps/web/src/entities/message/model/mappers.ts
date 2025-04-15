import { useChannelMembersStore } from "#/features/channel-members";
import { getUserAvatarUrl } from "#/shared/lib/avatar";

import type { Message, MessageAttachment, MessageResponse } from "./types";

// Пытаемся получить информацию о пользователе из хранилища
const getUserInfoFromStore = (userId: string) => {
    try {
        const store = useChannelMembersStore.getState();
        return store.users[userId];
    }
    catch {
        return null;
    }
};

// Преобразовать API-формат реакций во внутренний формат
const processReactions = (apiReactions: any[] = []): any[] => {
    // Группировка реакций по emoji
    const reactionsMap = new Map<string, { count: number; users: string[] }>();

    apiReactions.forEach((reaction) => {
        const emoji = reaction.emoji;
        if (!reactionsMap.has(emoji)) {
            reactionsMap.set(emoji, { count: 0, users: [] });
        }

        const current = reactionsMap.get(emoji)!;
        current.count += 1;
        if (reaction.userId) {
            current.users.push(reaction.userId);
        }
    });

    // Преобразование Map в массив
    return Array.from(reactionsMap.entries()).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        users: data.users,
    }));
};

export const mapMessageResponse = (messageData: any): Message => {
    if (!messageData) {
        return null as any;
    }

    // Map attachments
    const attachments = messageData.attachments?.map((attachment: any) => ({
        id: attachment.id,
        name: attachment.name || attachment.fileName || "Attachment",
        type: attachment.type || attachment.fileType || "application/octet-stream",
        url: attachment.url || attachment.s3Location || "",
        size: attachment.size,
    })) || [];

    // Обработка реакций
    const reactions = Array.isArray(messageData.reactions)
        ? processReactions(messageData.reactions)
        : [];

    // Получаем пользователя из хранилища по userId
    const userFromStore = getUserInfoFromStore(messageData.userId);

    // Create a basic author object
    const author = messageData.author || {
        id: messageData.userId,
        // Используем имя пользователя из хранилища, если доступно
        username: userFromStore?.username
            || messageData.mentions?.find((m: any) => m.userId === messageData.userId)?.username
            || `User_${messageData.userId?.substring(0, 5) || Math.floor(Math.random() * 10000)}`,
        // Добавляем имя и фамилию, если доступны
        name: userFromStore?.name,
        surname: userFromStore?.surname,
        // Use Dicebear avatar if no custom avatar is available
        avatar: userFromStore?.avatar || getUserAvatarUrl(messageData.userId),
    };

    // Use timestamp if available, otherwise use createdAt
    const timestamp = messageData.timestamp || messageData.createdAt;

    // Обработка сообщения, на которое отвечает текущее
    let replyTo;
    const replyToId = messageData.parentMessageId || messageData.replyToId;

    // Если есть объект с родительским сообщением в ответе API
    if (messageData.replyTo) {
        replyTo = mapMessageResponse(messageData.replyTo);
    }
    else if (messageData.parentMessage) {
        replyTo = mapMessageResponse(messageData.parentMessage);
    }
    // Если parentMessageId есть, но нет содержимого сообщения,
    // создаем временный объект для отображения
    else if (replyToId) {
        const parentUserInfo = getUserInfoFromStore(replyToId);

        // Создаем заглушку для недоступного сообщения
        replyTo = {
            id: replyToId,
            content: "Сообщение недоступно",
            author: {
                id: replyToId,
                username: parentUserInfo?.username || `User_${replyToId.substring(0, 5)}`,
                name: parentUserInfo?.name || "",
                surname: parentUserInfo?.surname || "",
            },
            channelId: messageData.channelId,
            timestamp: new Date(),
            isEdited: false,
            attachments: [],
            reactions: [],
            isUnavailable: true,
        };
    }

    const result = {
        id: messageData.id,
        content: messageData.content || "",
        author,
        channelId: messageData.channelId,
        timestamp: new Date(timestamp),
        isEdited: messageData.isEdited || false,
        replyToId,
        replyTo,
        attachments,
        reactions,
    };

    return result;
};
