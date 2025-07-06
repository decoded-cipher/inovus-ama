
import { env } from 'hono/adapter'

const DOCS_BUCKET = env.DOCS_BUCKET || 'https://dbb0b74b710f983689a9d222e325d2ec.r2.cloudflarestorage.com/inobot-autorag-docs'

// Uploads a File to Cloudflare R2 and returns the object key
export async function uploadToR2(file: File): Promise<string> {
  const key = `${Date.now()}_${file.name}`
  const url = `${DOCS_BUCKET}/${key}`
  await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file.stream(),
  })
  return key
}
