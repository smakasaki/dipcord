import type { Buffer } from "node:buffer";

export type UploadAttachmentParams = {
    fileBuffer: Buffer;
    fileName: string;
    fileType: string;
    fileSize: number;
};

export type UploadAttachmentResult = {
    fileName: string;
    fileType: string;
    size: number;
    s3Location: string;
};

export type S3Service = {
    uploadToS3: (fileBuffer: Buffer, fileName: string, contentType: string) => Promise<string>;
};

export function createUploadAttachmentUseCase(
    s3Service: S3Service,
) {
    return {
        async execute({ fileBuffer, fileName, fileType, fileSize }: UploadAttachmentParams): Promise<UploadAttachmentResult> {
            // Upload the file to S3
            const s3Location = await s3Service.uploadToS3(fileBuffer, fileName, fileType);

            // Return the result with file metadata
            return {
                fileName,
                fileType,
                size: fileSize,
                s3Location,
            };
        },
    };
}
