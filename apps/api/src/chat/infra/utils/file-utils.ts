import { randomUUID } from "node:crypto";
import path from "node:path";

/**
 * Generate a unique filename while preserving the original extension
 * @param originalFilename Original filename
 * @returns Unique filename with same extension
 */
export function generateUniqueFileName(originalFilename: string): string {
    const extension = path.extname(originalFilename);
    const basename = path.basename(originalFilename, extension);
    const sanitizedBasename = basename.replace(/[^a-z0-9]/gi, "-");

    return `${sanitizedBasename}-${randomUUID()}${extension}`;
}

/**
 * Get MIME type from file extension
 * @param filename Filename with extension
 * @returns MIME type or 'application/octet-stream' if unknown
 */
export function getMimeTypeFromFilename(filename: string): string {
    const extension = path.extname(filename).toLowerCase();

    // Common MIME types map
    const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".pdf": "application/pdf",
        ".doc": "application/msword",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xls": "application/vnd.ms-excel",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".ppt": "application/vnd.ms-powerpoint",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".mp4": "video/mp4",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".zip": "application/zip",
        ".json": "application/json",
        ".xml": "application/xml",
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
    };

    return mimeTypes[extension] || "application/octet-stream";
}
