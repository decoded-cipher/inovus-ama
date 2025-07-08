
import { getEmbedding } from './gemini'
import { searchVectorizeDB } from './pinecone'

// Configuration for relevance checking
const RELEVANCE_CONFIG = {
  MIN_SIMILARITY_THRESHOLD: 0.7,
  MAX_RESULTS: 5,
  MIN_MATCHES_FOR_RELEVANCE: 1
}

// Configuration for live data detection
const LIVE_DATA_CONFIG = {
  TEMPORAL_KEYWORDS: [
    'status', 'current', 'uptime', 'live', 'real-time',
    'availability', 'open', 'today', 'now', 'recent',
    'latest', 'updated', 'active', 'running', 'online'
  ],
  THRESHOLD_SCORE: 0.6 // Adjust based on keyword weight/frequency
}



/**
 * Checks if the question is relevant to Inovus Labs using semantic similarity
 * @param question - The user's question to evaluate
 * @returns Promise<boolean> - True if relevant, false otherwise
 */
export async function isInovusQuestion(question: string): Promise<boolean> {
  if (!question?.trim()) {
    console.log('Empty question provided');
    return false;
  }

  try {
    console.log(`Checking relevance for: "${question}"`);
    
    const embedding = await getEmbedding(question);
    const matches = await searchVectorizeDB(embedding, {
      topK: RELEVANCE_CONFIG.MAX_RESULTS,
      minScore: RELEVANCE_CONFIG.MIN_SIMILARITY_THRESHOLD
    });

    const isRelevant = matches.length >= RELEVANCE_CONFIG.MIN_MATCHES_FOR_RELEVANCE;
    
    console.log(`Relevance check result: ${isRelevant} (${matches.length} matches found)`);
    return isRelevant;
    
  } catch (error) {
    console.error('Error checking question relevance:', error);
    // Fail open - assume relevant if we can't check
    return true;
  }
}



/**
 * Determines if live MCP data should be fetched based on temporal keywords and context
 * @param question - The user's question to analyze
 * @returns Promise<boolean> - True if live data is needed, false otherwise
 */
export async function needsLiveData(question: string): Promise<boolean> {
  if (!question?.trim()) {
    return false;
  }

  const normalizedQuestion = question.toLowerCase().trim();
  
  // Calculate relevance score based on keyword presence and context
  let score = 0;
  let matchedKeywords: string[] = [];
  
  for (const keyword of LIVE_DATA_CONFIG.TEMPORAL_KEYWORDS) {
    if (normalizedQuestion.includes(keyword)) {
      matchedKeywords.push(keyword);
      // Weight certain keywords higher
      const weight = getKeywordWeight(keyword);
      score += weight;
    }
  }
  
  // Boost score for questions that seem to be asking about current state
  if (normalizedQuestion.match(/\b(is|are|can|will)\b.*\b(now|today|currently)\b/)) {
    score += 0.3;
  }
  
  // Boost score for time-sensitive patterns
  if (normalizedQuestion.match(/\b(what's|how's|when is|is it)\b/)) {
    score += 0.2;
  }
  
  const needsLive = score >= LIVE_DATA_CONFIG.THRESHOLD_SCORE;
  
  console.log(`Live data check: "${question}" | Score: ${score.toFixed(2)} | Keywords: [${matchedKeywords.join(', ')}] | Needs live: ${needsLive}`);
  
  return needsLive;
}



/**
 * Assigns weights to keywords based on their importance for live data detection
 * @param keyword - The keyword to weight
 * @returns number - Weight value (0.1 to 0.5)
 */
function getKeywordWeight(keyword: string): number {
  const highPriorityKeywords = ['now', 'current', 'live', 'real-time', 'today', 'status'];
  const mediumPriorityKeywords = ['recent', 'latest', 'updated', 'active', 'running'];
  
  if (highPriorityKeywords.includes(keyword)) {
    return 0.5;
  } else if (mediumPriorityKeywords.includes(keyword)) {
    return 0.3;
  } else {
    return 0.1;
  }
}
