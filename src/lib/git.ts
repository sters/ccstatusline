import { execSync } from 'child_process';

// Timeout for git commands (5 seconds)
const GIT_TIMEOUT = 5000;
// Max buffer size for git output (10MB)
const MAX_BUFFER = 10 * 1024 * 1024;

export function getGitBranch(cwd?: string): string {
  try {
    const options = cwd
      ? { cwd, encoding: 'utf8' as const, timeout: GIT_TIMEOUT, maxBuffer: MAX_BUFFER }
      : { encoding: 'utf8' as const, timeout: GIT_TIMEOUT, maxBuffer: MAX_BUFFER };
    const branch = execSync('git rev-parse --abbrev-ref HEAD', options).trim();
    return branch;
  } catch {
    return '';
  }
}

export function getGitStatus(cwd?: string): string {
  try {
    const options = cwd
      ? { cwd, encoding: 'utf8' as const, timeout: GIT_TIMEOUT, maxBuffer: MAX_BUFFER }
      : { encoding: 'utf8' as const, timeout: GIT_TIMEOUT, maxBuffer: MAX_BUFFER };
    const status = execSync('git --no-optional-locks status --porcelain', options).trim();

    if (!status) {
      return 'clean';
    }

    // Parse git status output
    const lines = status.split('\n').filter(Boolean);
    const modifiedCount = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
    const addedCount = lines.filter(l => l.startsWith('??')).length;
    const deletedCount = lines.filter(l => l.startsWith(' D') || l.startsWith('D ')).length;
    const stagedCount = lines.filter(l => /^[MADRC]/.test(l)).length;

    const parts = [];
    if (stagedCount > 0) parts.push(`${stagedCount} staged`);
    if (modifiedCount > 0) parts.push(`${modifiedCount} modified`);
    if (addedCount > 0) parts.push(`${addedCount} untracked`);
    if (deletedCount > 0) parts.push(`${deletedCount} deleted`);

    return parts.length > 0 ? parts.join(', ') : 'changes';
  } catch {
    return '';
  }
}

export function getGitStatusShort(cwd?: string): string {
  try {
    const options = cwd
      ? { cwd, encoding: 'utf8' as const, timeout: GIT_TIMEOUT, maxBuffer: MAX_BUFFER }
      : { encoding: 'utf8' as const, timeout: GIT_TIMEOUT, maxBuffer: MAX_BUFFER };
    const status = execSync('git --no-optional-locks status --porcelain', options).trim();

    if (!status) {
      return '✓';
    }

    // Parse git status output for a short indicator
    const lines = status.split('\n').filter(Boolean);
    const hasStaged = lines.some(l => /^[MADRC]/.test(l));
    const hasModified = lines.some(l => l.startsWith(' M') || l.startsWith('M '));
    const hasUntracked = lines.some(l => l.startsWith('??'));

    if (hasStaged) return '●';
    if (hasModified) return '✱';
    if (hasUntracked) return '…';
    return '○';
  } catch {
    return '';
  }
}