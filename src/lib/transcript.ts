export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function getCompactionColor(percentage: number): string {
  if (percentage >= 90) return '\x1b[31m'; // Red
  if (percentage >= 70) return '\x1b[33m'; // Yellow
  return '\x1b[32m'; // Green
}
