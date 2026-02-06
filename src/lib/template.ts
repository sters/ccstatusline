import Mustache from 'mustache';
import { ProcessedData } from './types.js';
import { getCompactionColor } from './transcript.js';
import { getGitBranch, getGitStatus, getGitStatusShort } from './git.js';

export const DEFAULT_TEMPLATE = '{{modelName}} | {{shortCwd}}{{#gitBranch}} ({{gitBranch}}){{/gitBranch}}';

// ANSI color codes
const COLORS = {
  // Reset
  reset: '\x1b[0m',

  // Regular colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright colors
  brightBlack: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Styles
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m'
};

function parseColorSpec(spec: string): string {
  const parts = spec.split(',').map(s => s.trim());
  let code = '';

  for (const part of parts) {
    // Try exact match first (for camelCase like bgRed)
    if (COLORS[part as keyof typeof COLORS]) {
      code += COLORS[part as keyof typeof COLORS];
    } else {
      // Try lowercase version
      const lowerPart = part.toLowerCase();
      if (COLORS[lowerPart as keyof typeof COLORS]) {
        code += COLORS[lowerPart as keyof typeof COLORS];
      }
    }
  }

  return code;
}

export async function renderTemplateAsync(template: string, data: ProcessedData): Promise<string> {
  Mustache.escape = (text) => text;

  // Cache git information for this render call
  let cachedGitBranch: string | null = null;
  let cachedGitStatus: string | null = null;
  let cachedGitStatusShort: string | null = null;

  // Define template functions
  const templateFunctions = {
    // Compaction percentage with color
    compactionPercentageColored: function() {
      const percentage = data.compactionPercentage;
      const color = getCompactionColor(percentage);
      return `${color}${percentage}%\x1b[0m`;
    },

    // Token count with color based on percentage
    tokenCountColored: function() {
      const color = getCompactionColor(data.compactionPercentage);
      return `${color}${data.tokenCount}\x1b[0m`;
    },

    // Git branch: stdin priority, fallback to command
    gitBranch: function() {
      if (data.gitBranch) return data.gitBranch;
      if (cachedGitBranch === null) cachedGitBranch = getGitBranch(data.processedCwd);
      return cachedGitBranch;
    },

    // Git status: stdin priority, fallback to command
    gitStatus: function() {
      if (data.gitStatus) return data.gitStatus;
      if (cachedGitStatus === null) cachedGitStatus = getGitStatus(data.processedCwd);
      return cachedGitStatus;
    },

    // Git status short indicator (cached)
    gitStatusShort: function() {
      if (cachedGitStatusShort === null) cachedGitStatusShort = getGitStatusShort(data.processedCwd);
      return cachedGitStatusShort;
    },
  };

  // Pre-process template to handle function patterns
  let processedTemplate = template;
  const functionPatterns = [
    'compactionPercentageColored',
    'tokenCountColored',
    'gitBranch',
    'gitStatus',
    'gitStatusShort',
  ] as const;

  // Create view with data for regular variables
  const view = { ...data };

  // Replace function calls in template with their evaluated values
  // and also update the view for conditional sections
  for (const funcName of functionPatterns) {
    const regex = new RegExp(`{{${funcName}}}`, 'g');
    const conditionalRegex = new RegExp(`{{[#^]${funcName}}}`, 'g');

    if (regex.test(processedTemplate) || conditionalRegex.test(processedTemplate)) {
      const value = templateFunctions[funcName]();
      // Update view for conditional sections
      view[funcName] = String(value);
      // Replace direct references
      processedTemplate = processedTemplate.replace(regex, String(value));
    }
  }

  // Handle color function BEFORE Mustache processing
  // Format: {{color:colorSpec:text}} e.g., {{color:red,bold:Hello}}
  const colorRegex = /{{color:([^:]+):([^}]+)}}/g;
  processedTemplate = processedTemplate.replace(colorRegex, (_match, colorSpec, text) => {
    const colorCode = parseColorSpec(colorSpec);
    return colorCode ? `${colorCode}${text}${COLORS.reset}` : text;
  });

  // Now render with regular Mustache for remaining variables
  return Mustache.render(processedTemplate, view);
}

// Keep synchronous version for backward compatibility
export function renderTemplate(template: string, data: ProcessedData): string {
  Mustache.escape = (text) => text;

  // Handle color function BEFORE Mustache processing
  // Format: {{color:colorSpec:text}} e.g., {{color:red,bold:Hello}}
  const colorRegex = /{{color:([^:]+):([^}]+)}}/g;
  let processedTemplate = template.replace(colorRegex, (_match, colorSpec, text) => {
    const colorCode = parseColorSpec(colorSpec);
    return colorCode ? `${colorCode}${text}${COLORS.reset}` : text;
  });

  // Then render with Mustache to resolve variables
  return Mustache.render(processedTemplate, data);
}
