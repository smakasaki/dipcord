/* eslint-disable node/no-process-env */
import type { Buffer } from "node:buffer";

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

// Create S3 client for Cloudflare R2
const s3Client = new S3Client({
    region: "auto", // R2 uses 'auto' for the region
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`, // Точка входа Cloudflare R2
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "dipcord-files";

/**
 * Upload a file to S3
 * @param fileBuffer File buffer to upload
 * @param fileName Filename to use
 * @param contentType Content/MIME type of the file
 * @returns S3 location string
 */
export async function uploadToS3(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
): Promise<string> {
    // Create a unique key for the file
    const key = `uploads/${randomUUID()}/${fileName}`;

    // Set up the upload parameters
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
    };

    // Upload to S3
    await s3Client.send(new PutObjectCommand(params));

    // Return the S3 location
    return key;
}

/**
 * Generate a pre-signed URL for downloading a file from S3
 * @param s3Location S3 location string
 * @param expiresIn Expiry time in seconds (default: 3600 = 1 hour)
 * @returns Pre-signed download URL
 */
export async function getS3DownloadUrl(
    s3Location: string,
    expiresIn: number = 3600,
): Promise<string> {
    const params = {
        Bucket: BUCKET_NAME,
        Key: s3Location,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
}
