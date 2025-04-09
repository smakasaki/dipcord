import { ActionIcon, Avatar, Badge, Group, Paper, Text, Tooltip } from "@mantine/core";
import { IconEdit, IconMessageForward, IconMoodSmile, IconTrash } from "@tabler/icons-react";
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
};

export function Message({
    message,
    isOwnMessage,
    onReply,
    onEdit,
    onDelete,
    onReact,
}: MessageProps) {
    const [showActions, setShowActions] = useState(false);

    const handleReply = () => onReply(message.id);
    const handleEdit = () => onEdit(message.id, message.content);
    const handleDelete = () => onDelete(message.id);
    const handleReact = () => onReact(message.id);

    return (
        <Paper
            className={styles.message}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={styles.messageContainer}>
                <Avatar src={message.author.avatar} alt={message.author.username} radius="xl" size="md" className={styles.avatar} />

                <div className={styles.messageContent}>
                    <Group gap="xs" className={styles.messageHeader}>
                        <Text fw={500} size="sm" c="dimmed">{message.author.username}</Text>
                        {message.author.role && (
                            <Badge size="xs" variant="light" color="blue">
                                {message.author.role}
                            </Badge>
                        )}
                        <Text size="xs" c="dimmed" className={styles.timestamp}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                            {message.isEdited && <span className={styles.edited}>(edited)</span>}
                        </Text>
                    </Group>

                    {message.replyTo && (
                        <div className={styles.replyContainer}>
                            <Text size="xs" c="dimmed">
                                Replying to
                                {" "}
                                <span className={styles.replyUsername}>{message.replyTo.author.username}</span>
                            </Text>
                            <Text size="xs" c="dimmed" truncate>{message.replyTo.content}</Text>
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
                            <ActionIcon onClick={handleReply} variant="subtle" color="gray">
                                <IconMessageForward size={16} />
                            </ActionIcon>
                        </Tooltip>

                        {isOwnMessage && (
                            <>
                                <Tooltip label="Edit">
                                    <ActionIcon onClick={handleEdit} variant="subtle" color="gray">
                                        <IconEdit size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Delete">
                                    <ActionIcon onClick={handleDelete} variant="subtle" color="gray">
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            </>
                        )}

                        <Tooltip label="React">
                            <ActionIcon onClick={handleReact} variant="subtle" color="gray">
                                <IconMoodSmile size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </div>
                )}
            </div>
        </Paper>
    );
}
