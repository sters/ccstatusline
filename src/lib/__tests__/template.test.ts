import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderTemplate, renderTemplateAsync, DEFAULT_TEMPLATE } from '../template';
import { ProcessedData } from '../types';

describe('renderTemplate', () => {
  let mockData: ProcessedData;

  beforeEach(() => {
    mockData = {
      // Directory paths
      processedCwd: '/home/user/project',
      shortCwd: '~/project',
      projectDir: '/home/user/project',
      shortProjectDir: '~/project',

      // Model info
      modelName: 'Claude',
      modelId: 'claude-3',

      // Git info
      gitBranch: 'main',
      gitStatus: 'clean',

      // Time info
      timestamp: '2024-01-01T00:00:00.000Z',
      date: '1/1/2024',
      time: '12:00:00 AM',

      // Cost info
      totalCostUsd: '$0.0234',
      totalDurationSec: '2m5s',
      totalApiDurationSec: '45.0s',
      totalLinesAdded: 150,
      totalLinesRemoved: 30,
      totalLinesChanged: 180,

      // Session info
      hookEventName: 'status_update',
      sessionId: 'abc-123',
      transcriptPath: '/path/to/transcript',
      version: '1.2.3',
      outputStyleName: 'minimal',

      // Context window
      contextWindowSize: 200000,
      usedPercentage: 78,
      remainingPercentage: 22,
      totalInputTokens: 100000,
      totalOutputTokens: 25000,
      currentInputTokens: 5000,
      currentOutputTokens: 1000,
      cacheCreationInputTokens: 2000,
      cacheReadInputTokens: 3000,

      // Token display
      tokenCount: '125.0K',
      tokenCountRaw: 125000,
      compactionPercentage: 78,

      // New fields
      exceeds200kTokens: false,
      vimMode: 'NORMAL',
      agentName: 'test-agent',
    };
  });

  it('should render the default template correctly', () => {
    const result = renderTemplate(DEFAULT_TEMPLATE, mockData);
    expect(result).toBe('Claude | ~/project (main)');
  });

  it('should render custom template', () => {
    const template = '{{modelName}} - {{gitBranch}} - {{shortCwd}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Claude - main - ~/project');
  });

  it('should render cost information', () => {
    const template = 'Cost: {{totalCostUsd}} | Time: {{totalDurationSec}} | Lines: +{{totalLinesAdded}}/-{{totalLinesRemoved}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Cost: $0.0234 | Time: 2m5s | Lines: +150/-30');
  });

  it('should render session information', () => {
    const template = 'Session: {{sessionId}} | Version: {{version}} | Style: {{outputStyleName}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Session: abc-123 | Version: 1.2.3 | Style: minimal');
  });

  it('should not escape HTML characters', () => {
    const template = '{{shortCwd}}';
    mockData.shortCwd = '~/project/<test>&';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('~/project/<test>&');
  });

  it('should handle conditional sections', () => {
    const template = '{{modelName}}{{#gitBranch}} [{{gitBranch}}]{{/gitBranch}}';

    const result1 = renderTemplate(template, mockData);
    expect(result1).toBe('Claude [main]');

    mockData.gitBranch = '';
    const result2 = renderTemplate(template, mockData);
    expect(result2).toBe('Claude');
  });

  it('should handle missing fields gracefully', () => {
    const template = '{{missingField}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('');
  });

  it('should render timestamps', () => {
    const template = '{{date}} {{time}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('1/1/2024 12:00:00 AM');
  });

  it('should handle complex nested conditionals', () => {
    const template = '{{#modelName}}Model: {{modelName}}{{#gitBranch}} ({{gitBranch}}){{/gitBranch}}{{/modelName}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Model: Claude (main)');
  });

  it('should handle arrays in data', () => {
    const template = '{{#items}}{{.}} {{/items}}';
    const dataWithArray = { ...mockData, items: ['a', 'b', 'c'] };
    const result = renderTemplate(template, dataWithArray as any);
    expect(result).toBe('a b c ');
  });

  it('should render project directory information', () => {
    const template = 'Project: {{shortProjectDir}} | Current: {{shortCwd}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Project: ~/project | Current: ~/project');
  });

  it('should handle cost conditionals', () => {
    const template = '{{#totalCostUsd}}Cost: {{totalCostUsd}}{{/totalCostUsd}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Cost: $0.0234');

    mockData.totalCostUsd = '';
    const result2 = renderTemplate(template, mockData);
    expect(result2).toBe('');
  });

  it('should handle color function with single color', () => {
    const template = '{{color:red:Error}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('\x1b[31mError\x1b[0m');
  });

  it('should handle color function with multiple styles', () => {
    const template = '{{color:red,bold:Important}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('\x1b[31m\x1b[1mImportant\x1b[0m');
  });

  it('should handle color function with background', () => {
    const template = '{{color:white,bgRed:Alert}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('\x1b[37m\x1b[41mAlert\x1b[0m');
  });

  it('should handle invalid color specs gracefully', () => {
    const template = '{{color:invalidcolor:Text}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('Text');
  });

  it('should combine color function with variables', () => {
    const template = '{{color:cyan:Model:}} {{modelName}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('\x1b[36mModel:\x1b[0m Claude');
  });

  it('should render new template variables', () => {
    const template = 'vim:{{vimMode}} agent:{{agentName}} ctx:{{contextWindowSize}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('vim:NORMAL agent:test-agent ctx:200000');
  });

  it('should render token display variables', () => {
    const template = '{{tokenCount}} ({{compactionPercentage}}%) raw:{{tokenCountRaw}}';
    const result = renderTemplate(template, mockData);
    expect(result).toBe('125.0K (78%) raw:125000');
  });
});

describe('renderTemplateAsync', () => {
  let mockData: ProcessedData;

  beforeEach(() => {
    mockData = {
      // Directory paths
      processedCwd: '/home/user/project',
      shortCwd: '~/project',
      projectDir: '/home/user/project',
      shortProjectDir: '~/project',

      // Model info
      modelName: 'Claude',
      modelId: 'claude-3',

      // Git info
      gitBranch: 'main',
      gitStatus: 'clean',

      // Time info
      timestamp: '2024-01-01T00:00:00.000Z',
      date: '1/1/2024',
      time: '12:00:00 AM',

      // Cost info
      totalCostUsd: '$0.0234',
      totalDurationSec: '2m5s',
      totalApiDurationSec: '45.0s',
      totalLinesAdded: 150,
      totalLinesRemoved: 30,
      totalLinesChanged: 180,

      // Session info
      hookEventName: 'status_update',
      sessionId: 'abc-123',
      transcriptPath: '/path/to/transcript',
      version: '1.2.3',
      outputStyleName: 'minimal',

      // Context window
      contextWindowSize: 200000,
      usedPercentage: 78,
      remainingPercentage: 22,
      totalInputTokens: 100000,
      totalOutputTokens: 25000,
      currentInputTokens: 5000,
      currentOutputTokens: 1000,
      cacheCreationInputTokens: 2000,
      cacheReadInputTokens: 3000,

      // Token display
      tokenCount: '125.0K',
      tokenCountRaw: 125000,
      compactionPercentage: 78,

      // New fields
      exceeds200kTokens: false,
      vimMode: 'NORMAL',
      agentName: 'test-agent',
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render tokenCount from ProcessedData', async () => {
    const template = 'Tokens: {{tokenCount}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Tokens: 125.0K');
  });

  it('should render tokenCountRaw from ProcessedData', async () => {
    const template = 'Raw tokens: {{tokenCountRaw}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Raw tokens: 125000');
  });

  it('should render compactionPercentage from ProcessedData', async () => {
    const template = 'Compaction: {{compactionPercentage}}%';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Compaction: 78%');
  });

  it('should render compactionPercentageColored function', async () => {
    const template = 'Status: {{compactionPercentageColored}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Status: \x1b[33m78%\x1b[0m');
  });

  it('should render tokenCountColored function', async () => {
    const template = 'Tokens: {{tokenCountColored}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Tokens: \x1b[33m125.0K\x1b[0m');
  });

  it('should handle zero token values', async () => {
    mockData.tokenCount = '0';
    mockData.tokenCountRaw = 0;
    mockData.compactionPercentage = 0;

    const tokenTemplate = 'Tokens: {{tokenCount}}';
    const tokenResult = await renderTemplateAsync(tokenTemplate, mockData);
    expect(tokenResult).toBe('Tokens: 0');

    const compactionTemplate = '{{compactionPercentage}}%';
    const compactionResult = await renderTemplateAsync(compactionTemplate, mockData);
    expect(compactionResult).toBe('0%');
  });

  it('should combine token fields with regular variables', async () => {
    const template = '{{modelName}} | {{shortCwd}} | {{tokenCount}} ({{compactionPercentage}}%)';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Claude | ~/project | 125.0K (78%)');
  });

  it('should handle templates without token functions', async () => {
    const template = '{{modelName}} | {{shortCwd}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('Claude | ~/project');
  });

  it('should render vimMode and agentName', async () => {
    const template = 'vim:{{vimMode}} agent:{{agentName}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('vim:NORMAL agent:test-agent');
  });

  it('should render context window variables', async () => {
    const template = 'ctx:{{contextWindowSize}} used:{{usedPercentage}}% remaining:{{remainingPercentage}}%';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('ctx:200000 used:78% remaining:22%');
  });

  it('should use gitBranch from data when available', async () => {
    const template = '{{gitBranch}}';
    const result = await renderTemplateAsync(template, mockData);
    expect(result).toBe('main');
  });
});
