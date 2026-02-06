import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { processInput } from '../processor';
import { StatuslineInput } from '../types';

describe('processInput', () => {
  const originalHome = process.env.HOME;
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HOME = '/home/user';
  });
  
  afterEach(() => {
    process.env.HOME = originalHome;
  });

  it('should process input with model and workspace', () => {
    const input: StatuslineInput = {
      model: {
        id: 'claude-3',
        display_name: 'Claude 3'
      },
      workspace: {
        current_dir: '/home/user/projects/test',
        project_dir: '/home/user/projects'
      }
    };

    const result = processInput(input);

    expect(result.modelName).toBe('Claude 3');
    expect(result.modelId).toBe('claude-3');
    expect(result.processedCwd).toBe('/home/user/projects/test');
    expect(result.shortCwd).toBe('~/projects/test');
    expect(result.projectDir).toBe('/home/user/projects');
    expect(result.shortProjectDir).toBe('~/projects');
  });

  it('should use defaults when model is missing', () => {
    const input: StatuslineInput = {
      workspace: {
        current_dir: '/home/user/work'
      }
    };

    const result = processInput(input);

    expect(result.modelName).toBe('Unknown');
    expect(result.modelId).toBe('unknown');
    expect(result.shortCwd).toBe('~/work');
  });

  it('should handle git information', () => {
    const input: StatuslineInput = {
      git: {
        branch: 'main',
        status: 'clean'
      }
    };

    const result = processInput(input);

    expect(result.gitBranch).toBe('main');
    expect(result.gitStatus).toBe('clean');
  });

  it('should handle cost information', () => {
    const input: StatuslineInput = {
      cost: {
        total_cost_usd: 0.0234,
        total_duration_ms: 125000,
        total_api_duration_ms: 45000,
        total_lines_added: 150,
        total_lines_removed: 30
      }
    };

    const result = processInput(input);

    expect(result.totalCostUsd).toBe('$0.0234');
    expect(result.totalDurationSec).toBe('2m5s');
    expect(result.totalApiDurationSec).toBe('45.0s');
    expect(result.totalLinesAdded).toBe(150);
    expect(result.totalLinesRemoved).toBe(30);
    expect(result.totalLinesChanged).toBe(180);
  });

  it('should handle session information', () => {
    const input: StatuslineInput = {
      hook_event_name: 'status_update',
      session_id: 'abc-123',
      transcript_path: '/path/to/transcript',
      version: '1.2.3',
      output_style: {
        name: 'minimal'
      }
    };

    const result = processInput(input);

    expect(result.hookEventName).toBe('status_update');
    expect(result.sessionId).toBe('abc-123');
    expect(result.transcriptPath).toBe('/path/to/transcript');
    expect(result.version).toBe('1.2.3');
    expect(result.outputStyleName).toBe('minimal');
  });

  it('should use cwd field when available', () => {
    const input: StatuslineInput = {
      cwd: '/direct/cwd/path',
      workspace: {
        current_dir: '/workspace/path'
      }
    };

    const result = processInput(input);

    expect(result.processedCwd).toBe('/direct/cwd/path');
  });

  it('should use process.cwd() when workspace is missing', () => {
    const mockCwd = '/current/working/dir';
    vi.spyOn(process, 'cwd').mockReturnValue(mockCwd);

    const input: StatuslineInput = {};
    const result = processInput(input);

    expect(result.processedCwd).toBe(mockCwd);
  });

  it('should include timestamp information', () => {
    const input: StatuslineInput = {};
    const result = processInput(input);

    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.date).toBeDefined();
    expect(result.time).toBeDefined();
  });

  it('should preserve additional properties from input', () => {
    const input: StatuslineInput = {
      customField: 'customValue',
      anotherField: 123
    };

    const result = processInput(input);

    expect(result.customField).toBe('customValue');
    expect(result.anotherField).toBe(123);
  });

  it('should handle paths without HOME prefix', () => {
    const input: StatuslineInput = {
      workspace: {
        current_dir: '/var/log/application'
      }
    };

    const result = processInput(input);

    expect(result.processedCwd).toBe('/var/log/application');
    expect(result.shortCwd).toBe('/var/log/application');
  });

  it('should format cost with zero values', () => {
    const input: StatuslineInput = {
      cost: {
        total_cost_usd: 0,
        total_duration_ms: 0,
        total_api_duration_ms: 0,
        total_lines_added: 0,
        total_lines_removed: 0
      }
    };

    const result = processInput(input);

    expect(result.totalCostUsd).toBe('$0.00');
    expect(result.totalDurationSec).toBe('0s');
    expect(result.totalApiDurationSec).toBe('0s');
    expect(result.totalLinesChanged).toBe(0);
  });

  it('should handle short durations', () => {
    const input: StatuslineInput = {
      cost: {
        total_cost_usd: 0.001,
        total_duration_ms: 1500,
        total_api_duration_ms: 500,
        total_lines_added: 5,
        total_lines_removed: 2
      }
    };

    const result = processInput(input);

    expect(result.totalCostUsd).toBe('$0.0010');
    expect(result.totalDurationSec).toBe('1.5s');
    expect(result.totalApiDurationSec).toBe('0.5s');
    expect(result.totalLinesChanged).toBe(7);
  });

  it('should process context_window data', () => {
    const input: StatuslineInput = {
      context_window: {
        total_input_tokens: 50000,
        total_output_tokens: 10000,
        context_window_size: 200000,
        used_percentage: 30,
        remaining_percentage: 70,
        current_usage: {
          input_tokens: 5000,
          output_tokens: 1000,
          cache_creation_input_tokens: 2000,
          cache_read_input_tokens: 3000,
        },
      },
    };

    const result = processInput(input);

    expect(result.contextWindowSize).toBe(200000);
    expect(result.usedPercentage).toBe(30);
    expect(result.remainingPercentage).toBe(70);
    expect(result.totalInputTokens).toBe(50000);
    expect(result.totalOutputTokens).toBe(10000);
    expect(result.currentInputTokens).toBe(5000);
    expect(result.currentOutputTokens).toBe(1000);
    expect(result.cacheCreationInputTokens).toBe(2000);
    expect(result.cacheReadInputTokens).toBe(3000);
    expect(result.tokenCount).toBe('60.0K');
    expect(result.tokenCountRaw).toBe(60000);
    expect(result.compactionPercentage).toBe(30);
  });

  it('should use defaults when context_window is missing', () => {
    const input: StatuslineInput = {};
    const result = processInput(input);

    expect(result.contextWindowSize).toBe(0);
    expect(result.usedPercentage).toBe(0);
    expect(result.remainingPercentage).toBe(0);
    expect(result.totalInputTokens).toBe(0);
    expect(result.totalOutputTokens).toBe(0);
    expect(result.currentInputTokens).toBe(0);
    expect(result.currentOutputTokens).toBe(0);
    expect(result.cacheCreationInputTokens).toBe(0);
    expect(result.cacheReadInputTokens).toBe(0);
    expect(result.tokenCount).toBe('0');
    expect(result.tokenCountRaw).toBe(0);
    expect(result.compactionPercentage).toBe(0);
  });

  it('should process vim, agent, and exceeds_200k_tokens', () => {
    const input: StatuslineInput = {
      vim: { mode: 'NORMAL' },
      agent: { name: 'test-agent' },
      exceeds_200k_tokens: true,
    };

    const result = processInput(input);

    expect(result.vimMode).toBe('NORMAL');
    expect(result.agentName).toBe('test-agent');
    expect(result.exceeds200kTokens).toBe(true);
  });

  it('should use defaults for vim, agent, exceeds_200k_tokens when missing', () => {
    const input: StatuslineInput = {};
    const result = processInput(input);

    expect(result.vimMode).toBe('');
    expect(result.agentName).toBe('');
    expect(result.exceeds200kTokens).toBe(false);
  });
});