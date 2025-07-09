
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Uploads a File to Cloudflare R2 using AWS SDK S3 client and returns the object key.
 * @param file - The file to upload
 * @param env - Environment variables containing R2 credentials
 * @returns The object key of the uploaded file
 * @throws Error if upload fails or invalid parameters
 */

export async function uploadToR2(file: File, env: any): Promise<string> {
  
  // Generate a unique key for the file
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${Date.now()}_${sanitizedFilename}`;

  console.log(`\n\n--- Uploading file: ${file.name} (${file.size} bytes) to R2 bucket`);

  try {
    // Initialize S3 client for R2
    const s3Client = new S3Client({
      region: env.R2_REGION,
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Create upload command
    const command = new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type || 'application/octet-stream',
      ContentLength: file.size,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Upload to R2
    await s3Client.send(command);

    console.log(`--- Successfully uploaded file with key: ${key}\n\n`);
    return key;
  } catch (error) {
    console.error(`--- Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}
