
/**
 * Splits a long text into smaller chunks, attempting to break at word boundaries.
 * 
 * @param text - The text to split
 * @param chunkSize - The maximum size of each chunk (default is 1000 characters)
 * @returns An array of text chunks
 */

export function splitTextIntoChunks(text: string, chunkSize: number = 1000): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  const chunks: string[] = []
  let startIndex = 0

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize
    
    // If we're not at the end of the text, try to break at a word boundary
    if (endIndex < text.length) {
      // Look for the last space, newline, or punctuation within the chunk
      const substring = text.substring(startIndex, endIndex)
      const lastSpace = Math.max(
        substring.lastIndexOf(' '),
        substring.lastIndexOf('\n'),
        substring.lastIndexOf('.'),
        substring.lastIndexOf('!'),
        substring.lastIndexOf('?')
      )
      
      // If we found a good break point and it's not too close to the start
      if (lastSpace > chunkSize * 0.7) {
        endIndex = startIndex + lastSpace + 1
      }
    }
    
    const chunk = text.substring(startIndex, endIndex).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    
    startIndex = endIndex
  }

  return chunks
}



/**
 * Checks if a file is a text file based on its filename and optional MIME type.
 * 
 * @param filename - The name of the file
 * @param mimeType - Optional MIME type of the file
 * @returns True if the file is a text file, false otherwise
 */

export function isTextFile(filename: string, mimeType?: string): boolean {
  const extension = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  const textExtensions = ['.txt', '.md', '.json', '.csv', '.xml', '.html', '.css', '.js', '.ts']
  
  return (
    textExtensions.includes(extension) ||
    (mimeType && mimeType.startsWith('text/')) ||
    (mimeType && mimeType.includes('json'))
  )
}
