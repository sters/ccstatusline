import fs from 'fs/promises';
import { existsSync } from 'fs';

const COMPACTION_THRESHOLD = 200000 * 0.8; // 160,000 tokens

interface TokenUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

interface TranscriptMessage {
  type?: string;
  message?: {
    usage?: TokenUsage;
  };
}

export async function readTranscriptTokens(transcriptPath: string): Promise<number> {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return 0;
  }

  try {
    const content = await fs.readFile(transcriptPath, 'utf-8');
    const lines = content.split('\n');

    // Read from the end to find the last assistant message with token usage
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const data: TranscriptMessage = JSON.parse(line);
        // Check if this is an assistant message with token usage
        if (data.type === 'assistant' && data.message?.usage) {
          const usage = data.message.usage;
          // Calculate total tokens from the last assistant message with usage info
          const totalTokens =
            (usage.input_tokens || 0) +
            (usage.output_tokens || 0) +
            (usage.cache_creation_input_tokens || 0) +
            (usage.cache_read_input_tokens || 0);

          return totalTokens;
        }
      } catch {
        // Skip lines that aren't valid JSON
        continue;
      }
    }

    return 0;
  } catch (error) {
    console.error(`Error reading transcript: ${error}`);
    return 0;
  }
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function calculateCompactionPercentage(tokens: number): number {
  return Math.min(100, Math.round((tokens / COMPACTION_THRESHOLD) * 100));
}

export function getCompactionColor(percentage: number): string {
  if (percentage >= 90) return '\x1b[31m'; // Red
  if (percentage >= 70) return '\x1b[33m'; // Yellow
  return '\x1b[32m'; // Green
}

export function getCompactionThreshold(): number {
  return COMPACTION_THRESHOLD;
}