import type { KeyboardEvent } from "react";

import {
    ActionIcon,
    Button,
    CloseButton,
    Group,
    Paper,
    Text,
    TextInput,
    Tooltip,
} from "@mantine/core";
import {
    IconAt,
    IconMessageForward,
    IconMoodSmile,
    IconPaperclip,
    IconSend,
    IconX,
} from "@tabler/icons-react";
import { useRef, useState } from "react";

import type { User } from "../../../entities/message";

import styles from "./message-input.module.css";

type MessageInputProps = {
    onSendMessage: (content: string, attachments: File[], replyToMessageId?: string) => void;
    replyToMessage?: {
        id: string;
        content: string;
        author: User;
    };
    onCancelReply?: () => void;
    channelName?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onTyping?: () => void;
};

export function MessageInput({
    onSendMessage,
    replyToMessage,
    onCancelReply,
    channelName,
    onFocus,
    onBlur,
    onTyping,
}: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleSubmit = () => {
        if (message.trim() || attachments.length > 0) {
            onSendMessage(message, attachments, replyToMessage?.id);
            setMessage("");
            setAttachments([]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
        else {
            // Handle typing indicator
            if (onTyping) {
                onTyping();

                // Clear any existing timeout
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }

                // Reset the timeout for typing indicator
                typingTimeoutRef.current = setTimeout(() => {
                    if (onBlur)
                        onBlur();
                }, 3000);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.currentTarget.value);
        // Trigger typing indicator
        if (onTyping)
            onTyping();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const insertMention = () => {
        setMessage(prev => `${prev}@`);
    };

    return (
        <Paper className={styles.container}>
            {replyToMessage && (
                <div className={styles.replyPreview}>
                    <Group gap="xs">
                        <IconMessageForward size={16} />
                        <Text size="xs">
                            Replying to
                            {" "}
                            <span className={styles.replyName}>{replyToMessage.author.username}</span>
                        </Text>
                        <Text size="xs" lineClamp={1} className={styles.replyContent}>
                            {replyToMessage.content}
                        </Text>
                    </Group>
                    <CloseButton size="xs" onClick={onCancelReply} title="Cancel reply" />
                </div>
            )}

            {attachments.length > 0 && (
                <div className={styles.attachmentPreview}>
                    <Group gap="sm">
                        {attachments.map((file, index) => (
                            <div key={index} className={styles.attachmentItem}>
                                <Text size="xs" truncate>{file.name}</Text>
                                <ActionIcon
                                    size="xs"
                                    variant="transparent"
                                    onClick={() => removeAttachment(index)}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            </div>
                        ))}
                    </Group>
                </div>
            )}

            <div className={styles.inputWrapper}>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                />

                <Tooltip label="Attach file">
                    <ActionIcon onClick={triggerFileInput} variant="subtle" color="orange.6" className={styles.inputAction}>
                        <IconPaperclip size={20} />
                    </ActionIcon>
                </Tooltip>

                <TextInput
                    placeholder={`Message ${channelName ? `#${channelName}` : ""}`}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className={styles.input}
                    rightSection={(
                        <ActionIcon onClick={handleSubmit} disabled={!message.trim() && attachments.length === 0} color="orange.6">
                            <IconSend size={16} />
                        </ActionIcon>
                    )}
                />

                <Group gap="xs" className={styles.extraActions}>
                    <Tooltip label="Add emoji">
                        <ActionIcon variant="subtle" color="orange.6">
                            <IconMoodSmile size={20} />
                        </ActionIcon>
                    </Tooltip>

                    <Tooltip label="Mention user">
                        <ActionIcon variant="subtle" color="orange.6" onClick={insertMention}>
                            <IconAt size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </div>
        </Paper>
    );
}
