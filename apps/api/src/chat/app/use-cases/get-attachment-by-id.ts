import type { AttachmentRepository, ChannelMemberRepository, MessageRepository } from "../ports/outgoing.js";

export type GetAttachmentByIdParams = {
    attachmentId: string;
    userId: string;
};

export type GetAttachmentByIdResult = {
    attachment: {
        id: string;
        messageId: string;
        fileName: string;
        fileType: string;
        size: number;
        s3Location: string;
        createdAt: Date;
    };
    hasAccess: boolean;
};

export function createGetAttachmentByIdUseCase(
    attachmentRepository: AttachmentRepository,
    messageRepository: MessageRepository,
    channelMemberRepository: ChannelMemberRepository,
) {
    return {
        async execute({ attachmentId, userId }: GetAttachmentByIdParams): Promise<GetAttachmentByIdResult> {
            // Get the attachment
            const attachment = await attachmentRepository.getAttachmentById(attachmentId);

            if (!attachment) {
                throw new Error("Attachment not found");
            }

            // Get the message to check channel access
            const message = await messageRepository.getMessage(attachment.messageId);

            if (!message) {
                throw new Error("Associated message not found");
            }

            // Check if the user has access to the channel
            const hasAccess = await channelMemberRepository.isUserChannelMember(userId, message.channelId);

            if (!hasAccess) {
                throw new Error("User does not have access to this attachment");
            }

            return {
                attachment,
                hasAccess,
            };
        },
    };
}
