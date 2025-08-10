
import { splitTextIntoChunks, extractMarkdownText } from './textExtraction'

export interface FileProcessingResult {
  textContent: string
  chunks: string[]
  error?: string
}

export interface SupportedFileType {
  extensions: string[]
  mimeTypes: string[]
  processor: (file: File) => Promise<string>
}

const FILE_TYPES: SupportedFileType[] = [
  {
    extensions: ['.txt'],
    mimeTypes: ['text/plain'],
    processor: async (file: File) => await file.text()
  },
  {
    extensions: ['.md', '.mdx'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    processor: async (file: File) => {
      const rawContent = await file.text()
      return extractMarkdownText(rawContent)
    }
  },
  {
    extensions: ['.json'],
    mimeTypes: ['application/json'],
    processor: async (file: File) => await file.text()
  },
  {
    extensions: ['.csv'],
    mimeTypes: ['text/csv', 'application/csv'],
    processor: async (file: File) => await file.text()
  }
]



/**
 * Detects the file type based on its name and MIME type.
 * Returns the first matching supported file type or null if unsupported.
 * 
 * @param file - The file to detect
 * @returns The detected file type or null if unsupported
 */

export function detectFileType(file: File): SupportedFileType | null {
  const fileName = file.name.toLowerCase()
  const fileType = file.type || ''

  if (fileType.startsWith('text/')) {
    return FILE_TYPES[0] // Default to text processor
  }

  for (const type of FILE_TYPES) {
    const hasMatchingExtension = type.extensions.some(ext => fileName.endsWith(ext))
    const hasMatchingMimeType = type.mimeTypes.some(mime => fileType === mime)
    
    if (hasMatchingExtension || hasMatchingMimeType) {
      return type
    }
  }

  return null
}



/**
 * Processes a file to extract text content and split it into chunks.
 * If the file type is not supported, it attempts to read it as plain text.
 * 
 * @param file - The file to process
 * @param chunkSize - The size of each text chunk (default: 1000 characters)
 * @returns An object containing the extracted text, chunks, and any error message
 */

export async function processFile(file: File, chunkSize: number = 1000): Promise<FileProcessingResult> {
  const fileType = detectFileType(file)
  
  if (!fileType) {
    try {
      const textContent = await file.text()
      return {
        textContent,
        chunks: textContent ? splitTextIntoChunks(textContent, chunkSize) : []
      }
    } catch (error) {
      return {
        textContent: '',
        chunks: [],
        error: `Unsupported file type: ${file.type || 'unknown'}`
      }
    }
  }

  try {
    const textContent = await fileType.processor(file)
    const chunks = textContent ? splitTextIntoChunks(textContent, chunkSize) : []
    
    return {
      textContent,
      chunks
    }
  } catch (error) {
    console.warn(`Failed to extract text from ${file.name}:`, error)
    return {
      textContent: '',
      chunks: [],
      error: `Failed to process file: ${(error as Error).message}`
    }
  }
}



/**
 * Parses metadata from a raw input, which can be a JSON string or an object.
 * If the input is a string, it attempts to parse it as JSON.
 * If parsing fails, it returns an empty object.
 * 
 * @param metaRaw - The raw metadata input
 * @returns Parsed metadata as a record
 */

export function parseMetadata(metaRaw: unknown): Record<string, any> {
  if (typeof metaRaw === 'string') {
    try {
      return JSON.parse(metaRaw)
    } catch {
      return {}
    }
  }
  return {}
}
