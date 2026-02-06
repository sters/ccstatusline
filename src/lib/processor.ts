import { StatuslineInput, ProcessedData } from './types.js';
import { formatTokenCount } from './transcript.js';

function formatDuration(ms: number | undefined): string {
  if (!ms) return '0s';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m${remainingSeconds}s`;
}

function formatCost(usd: number | undefined): string {
  if (!usd) return '$0.00';
  return `$${usd.toFixed(4)}`;
}

function shortenPath(path: string, home: string): string {
  return path.replace(home, '~');
}

export function processInput(input: StatuslineInput): ProcessedData {
  const home = process.env.HOME || '';

  // Process directory paths
  const processedCwd = input.cwd || input.workspace?.current_dir || process.cwd();
  const projectDir = input.workspace?.project_dir || processedCwd;
  const shortCwd = shortenPath(processedCwd, home);
  const shortProjectDir = shortenPath(projectDir, home);

  // Process time
  const now = new Date();

  // Process cost info
  const totalLinesAdded = input.cost?.total_lines_added || 0;
  const totalLinesRemoved = input.cost?.total_lines_removed || 0;
  const totalLinesChanged = totalLinesAdded + totalLinesRemoved;

  // Process context window
  const cw = input.context_window;
  const totalInputTokens = cw?.total_input_tokens ?? 0;
  const totalOutputTokens = cw?.total_output_tokens ?? 0;
  const tokenCountRaw = totalInputTokens + totalOutputTokens;

  return {
    ...input,
    // Directory paths
    processedCwd,
    shortCwd,
    projectDir,
    shortProjectDir,

    // Model info
    modelName: input.model?.display_name || 'Unknown',
    modelId: input.model?.id || 'unknown',

    // Git info
    gitBranch: input.git?.branch || '',
    gitStatus: input.git?.status || '',

    // Time info
    timestamp: now.toISOString(),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),

    // Cost info
    totalCostUsd: formatCost(input.cost?.total_cost_usd),
    totalDurationSec: formatDuration(input.cost?.total_duration_ms),
    totalApiDurationSec: formatDuration(input.cost?.total_api_duration_ms),
    totalLinesAdded,
    totalLinesRemoved,
    totalLinesChanged,

    // Session info
    hookEventName: input.hook_event_name || '',
    sessionId: input.session_id || '',
    transcriptPath: input.transcript_path || '',
    version: input.version || '',
    outputStyleName: input.output_style?.name || '',

    // Context window
    contextWindowSize: cw?.context_window_size ?? 0,
    usedPercentage: cw?.used_percentage ?? 0,
    remainingPercentage: cw?.remaining_percentage ?? 0,
    totalInputTokens,
    totalOutputTokens,
    currentInputTokens: cw?.current_usage?.input_tokens ?? 0,
    currentOutputTokens: cw?.current_usage?.output_tokens ?? 0,
    cacheCreationInputTokens: cw?.current_usage?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: cw?.current_usage?.cache_read_input_tokens ?? 0,

    // Token display
    tokenCount: formatTokenCount(tokenCountRaw),
    tokenCountRaw,
    compactionPercentage: cw?.used_percentage ?? 0,

    // New fields
    exceeds200kTokens: input.exceeds_200k_tokens ?? false,
    vimMode: input.vim?.mode ?? '',
    agentName: input.agent?.name ?? '',
  };
}