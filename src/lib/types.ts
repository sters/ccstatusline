export interface StatuslineInput {
  hook_event_name?: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  model?: {
    id: string;
    display_name: string;
  };
  workspace?: {
    current_dir: string;
    project_dir?: string;
  };
  version?: string;
  output_style?: {
    name: string;
  };
  cost?: {
    total_cost_usd: number;
    total_duration_ms: number;
    total_api_duration_ms: number;
    total_lines_added: number;
    total_lines_removed: number;
  };
  git?: {
    branch?: string;
    status?: string;
  };
  [key: string]: unknown;
}

export interface ProcessedData extends StatuslineInput {
  // Processed directory paths
  processedCwd: string;
  shortCwd: string;
  projectDir: string;
  shortProjectDir: string;

  // Model info
  modelName: string;
  modelId: string;

  // Git info
  gitBranch: string;
  gitStatus: string;

  // Time info
  timestamp: string;
  date: string;
  time: string;

  // Cost info
  totalCostUsd: string;
  totalDurationSec: string;
  totalApiDurationSec: string;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  totalLinesChanged: number;

  // Session info
  hookEventName: string;
  sessionId: string;
  transcriptPath: string;
  version: string;
  outputStyleName: string;
}

export interface CliOptions {
  template?: string;
  color?: boolean;
  debug?: boolean;
}