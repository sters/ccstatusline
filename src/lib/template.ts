import Mustache from 'mustache';
import { ProcessedData } from './types.js';
import {
  readTranscriptTokens,
  formatTokenCount,
  calculateCompactionPercentage,
  getCompactionColor
} from './transcript.js';

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

  // Cache tokens for this render call to avoid multiple reads
  let cachedTokens: number | null = null;
  const getTokens = async () => {
    if (cachedTokens !== null) return cachedTokens;
    if (!data.transcriptPath) return 0;
    cachedTokens = await readTranscriptTokens(data.transcriptPath);
    return cachedTokens;
  };

  // Define template functions
  const templateFunctions = {
    // Token count function
    tokenCount: async function() {
      const tokens = await getTokens();
      return formatTokenCount(tokens);
    },

    // Raw token count (unformatted)
    tokenCountRaw: async function() {
      return await getTokens();
    },

    // Compaction percentage
    compactionPercentage: async function() {
      const tokens = await getTokens();
      return calculateCompactionPercentage(tokens);
    },

    // Compaction percentage with color
    compactionPercentageColored: async function() {
      const tokens = await getTokens();
      const percentage = calculateCompactionPercentage(tokens);
      const color = getCompactionColor(percentage);
      const reset = '\x1b[0m';
      return `${color}${percentage}%${reset}`;
    },

    // Token count with color based on percentage
    tokenCountColored: async function() {
      const tokens = await getTokens();
      const percentage = calculateCompactionPercentage(tokens);
      const color = getCompactionColor(percentage);
      const reset = '\x1b[0m';
      return `${color}${formatTokenCount(tokens)}${reset}`;
    }
  };

  // Pre-process template to handle async functions
  let processedTemplate = template;
  const functionPatterns = [
    'tokenCount',
    'tokenCountRaw',
    'compactionPercentage',
    'compactionPercentageColored',
    'tokenCountColored'
  ] as const;

  // Replace function calls in template with their evaluated values
  for (const funcName of functionPatterns) {
    const regex = new RegExp(`{{${funcName}}}`, 'g');
    if (regex.test(processedTemplate)) {
      const value = await templateFunctions[funcName]();
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

  // Create view with data for regular variables
  const view = { ...data };

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