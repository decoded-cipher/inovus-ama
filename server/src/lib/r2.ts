
/**
 * Uploads a File to Cloudflare R2 and returns the object key.
 * @param file - The file to upload
 * @param bucketUrl - The URL of the R2 bucket
 * @returns The object key of the uploaded file
 * @throws Error if upload fails or invalid parameters
 */

export async function uploadToR2(file: File, bucketUrl: string): Promise<string> {
  
  // const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${Date.now()}_${file.name}`;
  const url = `${bucketUrl}/${key}`;

  console.log(`--- Uploading file: ${file.name} (${file.size} bytes) to R2 bucket: ${bucketUrl}`);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file.stream(),
    });

    if (!response.ok) {
      throw new Error(`--- Upload failed: ${response.status} ${response.statusText}`);
    }

    console.log(`--- Successfully uploaded file with key: ${key}`);
    return key;
  } catch (error) {
    console.error(`--- Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}