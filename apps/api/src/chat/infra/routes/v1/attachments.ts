import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import { StandardErrorResponses } from "@dipcord/schema/common";
import { Buffer } from "node:buffer";
import { z } from "zod";

import { getS3DownloadUrl } from "#chat/infra/services/s3-service.js";
import { generateUniqueFileName } from "#chat/infra/utils/file-utils.js";

/**
 * Attachment routes for file uploads and downloads
 */
const routes: FastifyPluginAsyncZod = async function (fastify): Promise<void> {
    /**
     * Upload a file
     */
    fastify.post("/files/upload", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Files"],
            description: "Upload a file to be attached to a message",
            consumes: ["multipart/form-data"],
            body: z.object({
                file: z.any(), // Will be handled by the multipart parser
            }),
            response: {
                200: z.object({
                    fileName: z.string(),
                    fileType: z.string(),
                    size: z.number(),
                    s3Location: z.string(),
                }),
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        // Access the uploaded file
        const data = await request.file();

        if (!data) {
            return reply.status(400).send({
                statusCode: 400,
                error: "Bad Request",
                message: "No file uploaded",
            });
        }

        const { filename, mimetype, file } = data;

        // Generate a unique filename
        const uniqueFileName = generateUniqueFileName(filename);

        // Upload to S3
        const buffer = [];
        for await (const chunk of file) {
            buffer.push(chunk);
        }

        const fileBuffer = Buffer.concat(buffer);
        const fileSize = fileBuffer.length;

        // Check file size (e.g., max 100MB)
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

        if (fileSize > MAX_FILE_SIZE) {
            return reply.status(400).send({
                statusCode: 400,
                error: "Bad Request",
                message: "File size exceeds the limit (100MB)",
            });
        }

        // Use the uploadAttachment use case through chatService
        const result = await fastify.chatService.uploadAttachment({
            fileBuffer,
            fileName: uniqueFileName,
            fileType: mimetype,
            fileSize,
        });

        return result;
    });

    /**
     * Get download URL for a file
     */
    fastify.get("/files/:attachmentId", {
        config: {
            auth: true,
        },
        schema: {
            tags: ["Files"],
            description: "Get a pre-signed download URL for a file attachment",
            params: z.object({
                attachmentId: z.string().uuid(),
            }),
            response: {
                200: z.object({
                    downloadUrl: z.string(),
                    fileName: z.string(),
                    fileType: z.string(),
                    expiresIn: z.number(),
                }),
                ...StandardErrorResponses,
            },
            security: [{ cookieAuth: [] }],
        },
    }, async (request, reply) => {
        const { attachmentId } = request.params;
        const userId = request.user!.id;

        // Use the getAttachmentById use case through chatService
        try {
            const result = await fastify.chatService.getAttachmentById({
                attachmentId,
                userId,
            });

            if (!result.hasAccess) {
                return reply.status(403).send({
                    statusCode: 403,
                    error: "Forbidden",
                    message: "You don't have access to this file",
                });
            }

            // Generate pre-signed URL
            const downloadUrl = await getS3DownloadUrl(result.attachment.s3Location);

            return {
                downloadUrl,
                fileName: result.attachment.fileName,
                fileType: result.attachment.fileType,
                expiresIn: 3600, // URL expires in 1 hour
            };
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message === "Attachment not found") {
                    return reply.status(404).send({
                        statusCode: 404,
                        error: "Not Found",
                        message: "Attachment not found",
                    });
                }
                else if (error.message === "Associated message not found") {
                    return reply.status(404).send({
                        statusCode: 404,
                        error: "Not Found",
                        message: "Associated message not found",
                    });
                }
                else if (error.message === "User does not have access to this attachment") {
                    return reply.status(403).send({
                        statusCode: 403,
                        error: "Forbidden",
                        message: "You don't have access to this file",
                    });
                }
            }

            // If it's another error, re-throw to let the global error handler handle it
            throw error;
        }
    });
};

export default routes;
