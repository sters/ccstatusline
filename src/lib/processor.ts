import { StatuslineInput, ProcessedData } from './types.js';

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
  };
}