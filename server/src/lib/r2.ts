import { env } from 'hono/adapter'

// Uploads a File to Cloudflare R2 and returns the object key
export async function uploadToR2(file: File): Promise<string> {
  const key = `${Date.now()}_${file.name}`
  await env.DOCS_BUCKET.put(key, file.stream())
  return key
}
