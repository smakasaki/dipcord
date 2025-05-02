import { ActionIcon, Avatar, Badge, Group, Paper, Text, Tooltip } from "@mantine/core";
import { IconEdit, IconMessageForward, IconMoodSmile, IconTrash } from "@tabler/icons-react";
import { useMessagePermissionsStore } from "#/features/channel-messages/model/permissions";
import { getUserAvatarUrl } from "#/shared/lib/avatar";
import { useState } from "react";

import type { Message as MessageType } from "../model/types";

import styles from "./message.module.css";

type MessageProps = {
    message: MessageType;
    isOwnMessage: boolean;
    onReply: (messageId: string) => void;
    onEdit: (messageId: string, content?: string) => void;
    onDelete: (messageId: string) => void;
    onReact: (messageId: string) => void;
    onGoToMessage?: (messageId: string) => void;
};

export function Message({
    message,
    isOwnMessage,
    onReply,
    onEdit,
    onDelete,
    onReact,
    onGoToMessage,
}: MessageProps) {
    const [showActions, setShowActions] = useState(false);
    const { canEditMessage, canDeleteMessage } = useMessagePermissionsStore();

    const canEdit = canEditMessage(message.author.id);
    const canDelete = canDeleteMessage(message.author.id);

    const handleReply = () => onReply(message.id);
    const handleEdit = () => onEdit(message.id, message.content);
    const handleDelete = () => onDelete(message.id);
    const handleReact = () => onReact(message.id);

    // Get avatar URL (use Dicebear as fallback if no custom avatar)
    const avatarUrl = message.author.avatar || getUserAvatarUrl(message.author.id);

    // Use brand-orange color for buttons when it's the user's own message
    const actionColor = isOwnMessage ? "brand-orange" : "gray";

    return (
        <Paper
            className={styles.message}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={styles.messageContainer}>
                <Avatar src={avatarUrl} alt={message.author.username} radius="xl" size="md" className={styles.avatar} />

                <div className={styles.messageContent}>
                    <Group gap="xs" className={styles.messageHeader}>
                        <Text fw={500} size="sm" c={isOwnMessage ? "brand-orange.7" : "dimmed"}>
                            {message.author.name && message.author.surname
                                ? `${message.author.name} ${message.author.surname}`
                                : message.author.username}
                        </Text>
                        <Text size="xs" c="dimmed" className={styles.timestamp}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                            {message.isEdited && <span className={styles.edited}>(edited)</span>}
                        </Text>
                    </Group>

                    {/* Если есть replyToId, но нет объекта replyTo */}
                    {message.replyToId && !message.replyTo && (
                        <div className={styles.replyContainer}>
                            <Text size="xs" c="dimmed">
                                Replying to message
                                {": "}
                                <span className={`${styles.replyContent} ${styles.italic}`}>
                                    Сообщение не найдено или удалено
                                </span>
                            </Text>
                        </div>
                    )}

                    {/* Если есть объект replyTo */}
                    {message.replyTo && (
                        <div
                            className={`${styles.replyContainer} ${message.replyTo?.isUnavailable ? "" : onGoToMessage ? styles.clickableReply : ""}`}
                            onClick={() => message.replyTo && !message.replyTo.isUnavailable && onGoToMessage && onGoToMessage(message.replyTo.id)}
                            role={message.replyTo && !message.replyTo.isUnavailable && onGoToMessage ? "button" : undefined}
                            tabIndex={message.replyTo && !message.replyTo.isUnavailable && onGoToMessage ? 0 : undefined}
                        >
                            <Text size="xs" c="dimmed">
                                Replying to
                                {" "}
                                <span className={styles.replyUsername}>
                                    {message.replyTo.author && message.replyTo.author.username
                                        ? (
                                                message.replyTo.author.name && message.replyTo.author.surname
                                                    ? `${message.replyTo.author.name} ${message.replyTo.author.surname}`
                                                    : message.replyTo.author.username
                                            )
                                        : "Unknown User"}
                                </span>
                                {": "}
                                <span className={`${styles.replyContent} ${message.replyTo.isUnavailable ? styles.italic : ""}`}>
                                    {message.replyTo?.content || "Сообщение недоступно"}
                                </span>
                            </Text>
                        </div>
                    )}

                    <Text className={styles.messageText}>
                        {message.content}
                    </Text>

                    {message.attachments && message.attachments.length > 0 && (
                        <div className={styles.attachments}>
                            {message.attachments.map(attachment => (
                                <div key={attachment.id} className={styles.attachment}>
                                    {attachment.type.startsWith("image/")
                                        ? (
                                                <img
                                                    src={attachment.url}
                                                    alt={attachment.name}
                                                    className={styles.attachmentImage}
                                                />
                                            )
                                        : (
                                                <div className={styles.fileAttachment}>
                                                    <Text size="sm">{attachment.name}</Text>
                                                </div>
                                            )}
                                </div>
                            ))}
                        </div>
                    )}

                    {message.reactions && message.reactions.length > 0 && (
                        <div className={styles.reactions}>
                            {message.reactions.map(reaction => (
                                <Badge key={reaction.emoji} className={styles.reaction}>
                                    {reaction.emoji}
                                    {" "}
                                    {reaction.count}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {showActions && (
                    <div className={styles.messageActions}>
                        <Tooltip label="Reply">
                            <ActionIcon onClick={handleReply} variant="subtle" color={actionColor}>
                                <IconMessageForward size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {canEdit && (
                            <Tooltip label="Edit">
                                <ActionIcon onClick={handleEdit} variant="subtle" color={actionColor}>
                                    <IconEdit size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}

                        {canDelete && (
                            <Tooltip label="Delete">
                                <ActionIcon onClick={handleDelete} variant="subtle" color={actionColor}>
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Tooltip>
                        )}

                        <Tooltip label="React">
                            <ActionIcon onClick={handleReact} variant="subtle" color={actionColor}>
                                <IconMoodSmile size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                )}
            </div>
        </Paper>
    );
}
