
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
 * Extracts clean text content from markdown and MDX files.
 * Removes markdown syntax while preserving important structural information.
 * 
 * @param markdownContent - The raw markdown/MDX content
 * @returns Clean text content with preserved structure
 */
export function extractMarkdownText(markdownContent: string): string {
  if (!markdownContent || markdownContent.trim().length === 0) {
    return ''
  }

  let text = markdownContent

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove JSX/TSX code blocks (for MDX files)
  text = text.replace(/```(?:jsx|tsx|js|ts)[\s\S]*?```/g, '')
  
  // Remove regular code blocks but preserve language info
  text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return lang ? `[${lang.toUpperCase()} CODE BLOCK]` : '[CODE BLOCK]'
  })
  
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1')
  
  // Remove HTML tags but preserve their content
  text = text.replace(/<[^>]*>/g, '')
  
  // Remove JSX expressions
  text = text.replace(/\{[\s\S]*?\}/g, '')
  
  // Process headers - convert to readable format
  text = text.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
    const headerMatch = match.match(/^#+/)
    const level = headerMatch ? headerMatch[0].length : 1
    const prefix = level === 1 ? 'TITLE: ' : level === 2 ? 'SECTION: ' : 'SUBSECTION: '
    return `${prefix}${content}`
  })
  
  // Process bold and italic text
  text = text.replace(/\*\*(.+?)\*\*/g, '$1') // Bold
  text = text.replace(/\*(.+?)\*/g, '$1')     // Italic
  text = text.replace(/_(.+?)_/g, '$1')       // Underline
  text = text.replace(/~~(.+?)~~/g, '$1')     // Strikethrough
  
  // Process links - extract text and URL
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    return `${text} (${url})`
  })
  
  // Process images - convert to descriptive text
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    return alt ? `[IMAGE: ${alt}]` : '[IMAGE]'
  })
  
  // Process numbered lists
  text = text.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, (match, number, content) => {
    return `• ${content}`
  })
  
  // Process blockquotes
  text = text.replace(/^>\s+(.+)$/gm, 'QUOTE: $1')
  
  // Process lists
  text = text.replace(/^[\s]*[-*+]\s+(.+)$/gm, '• $1')
  text = text.replace(/^[\s]*\d+\.\s+(.+)$/gm, '• $1')
  
  // Process horizontal rules
  text = text.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '---')
  
  // Process tables - convert to readable format
  text = text.replace(/\|(.+)\|/g, (match, content) => {
    return content.trim()
  })
  
  // Remove table separators and clean up table formatting
  text = text.replace(/^[\s]*\|[\s]*[-:|]+\|[\s]*$/gm, '')
  text = text.replace(/\|/g, ' | ')
  
  // Clean up multiple newlines and spaces
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
  text = text.replace(/[ \t]+/g, ' ')
  
  // Remove leading/trailing whitespace
  text = text.trim()
  
  return text
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
  const textExtensions = ['.txt', '.md', '.mdx', '.json', '.csv', '.xml', '.html', '.css', '.js', '.ts']
  
  if (textExtensions.includes(extension)) return true
  if (mimeType && mimeType.startsWith('text/')) return true
  if (mimeType && mimeType.includes('json')) return true
  return false
}
