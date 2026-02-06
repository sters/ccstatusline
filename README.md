# ccstatusline

A customizable statusline for Claude Code that supports Mustache templates with lazy-evaluated functions for git info and color-coded token tracking.

## Features

- Mustache template support for customizable statusline
- Context window token tracking from stdin data
- Lazy-evaluated git template functions
- Color-coded output based on usage thresholds
- Vim mode and agent name display

## Usage

Configure in `.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bunx github:sters/ccstatusline --template '{{modelName}} | {{shortCwd}} | {{tokenCountColored}} ({{compactionPercentageColored}})'"
  }
}
```

## Template Variables

### Basic Variables
- `{{modelName}}` - Current model display name
- `{{modelId}}` - Current model ID
- `{{shortCwd}}` - Current working directory (shortened with ~)
- `{{processedCwd}}` - Full current working directory path
- `{{shortProjectDir}}` - Project directory (shortened with ~)
- `{{projectDir}}` - Full project directory path
- `{{timestamp}}` - ISO timestamp
- `{{date}}` - Local date
- `{{time}}` - Local time
- `{{totalCostUsd}}` - Total cost in USD
- `{{totalDurationSec}}` - Total duration
- `{{totalApiDurationSec}}` - API duration
- `{{totalLinesAdded}}` - Lines added
- `{{totalLinesRemoved}}` - Lines removed
- `{{totalLinesChanged}}` - Total lines changed
- `{{sessionId}}` - Session ID
- `{{transcriptPath}}` - Path to transcript file
- `{{version}}` - Claude Code version
- `{{outputStyleName}}` - Output style name

### Context Window Variables

These are derived from the `context_window` field in stdin data:

- `{{tokenCount}}` - Formatted token count (e.g., "1.2K", "2.5M") - sum of input + output tokens
- `{{tokenCountRaw}}` - Raw token count number
- `{{compactionPercentage}}` - Context window used percentage (0-100)
- `{{contextWindowSize}}` - Total context window size in tokens
- `{{usedPercentage}}` - Context window used percentage
- `{{remainingPercentage}}` - Context window remaining percentage
- `{{totalInputTokens}}` - Total input tokens
- `{{totalOutputTokens}}` - Total output tokens
- `{{currentInputTokens}}` - Current request input tokens
- `{{currentOutputTokens}}` - Current request output tokens
- `{{cacheCreationInputTokens}}` - Cache creation input tokens
- `{{cacheReadInputTokens}}` - Cache read input tokens
- `{{exceeds200kTokens}}` - Whether token usage exceeds 200K

### Additional Variables

- `{{vimMode}}` - Current vim mode (e.g., "NORMAL", "INSERT")
- `{{agentName}}` - Current agent name

### Template Functions (Lazy-Evaluated)

These functions are only calculated when used in the template:

- `{{gitBranch}}` - Current git branch (stdin priority, command fallback)
- `{{gitStatus}}` - Git status (stdin priority, command fallback)
- `{{gitStatusShort}}` - Git status (short format, command only)
- `{{compactionPercentageColored}}` - Percentage with color coding:
  - Green: < 70%
  - Yellow: 70-89%
  - Red: >= 90%
- `{{tokenCountColored}}` - Token count with color based on percentage

### Color Function

Apply ANSI colors and styles to text:

- `{{color:colorSpec:text}}` - Apply color/style to text

Available colors:
- Regular: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- Bright: `brightBlack`, `brightRed`, `brightGreen`, `brightYellow`, `brightBlue`, `brightMagenta`, `brightCyan`, `brightWhite`
- Background: `bgBlack`, `bgRed`, `bgGreen`, `bgYellow`, `bgBlue`, `bgMagenta`, `bgCyan`, `bgWhite`

Available styles:
- `bold`, `dim`, `italic`, `underline`, `blink`, `reverse`, `hidden`, `strikethrough`

Multiple colors/styles can be combined with commas:
- `{{color:red:Error}}` - Red text
- `{{color:red,bold:Important}}` - Bold red text
- `{{color:white,bgRed:Alert}}` - White text on red background
- `{{color:cyan,underline:Link}}` - Underlined cyan text

## Examples

### Simple statusline
```bash
bunx github:sters/ccstatusline --template '{{modelName}} | {{shortCwd}}'
```

### With token tracking
```bash
bunx github:sters/ccstatusline --template '{{modelName}} | {{tokenCount}} tokens ({{compactionPercentage}}%)'
```

### Color-coded with git info
```bash
bunx github:sters/ccstatusline --template '{{modelName}} | {{shortCwd}}{{#gitBranch}} ({{gitBranch}}){{/gitBranch}} | {{tokenCountColored}} ({{compactionPercentageColored}})'
```

### Full information
```bash
bunx github:sters/ccstatusline --template '{{modelName}} | {{shortCwd}} | {{gitBranch}} | Tokens: {{tokenCount}}/160K ({{compactionPercentage}}%) | Cost: {{totalCostUsd}}'
```

### With custom colors
```bash
bunx github:sters/ccstatusline --template '{{color:cyan,bold:Model}} {{modelName}} | {{color:yellow:Dir:}} {{shortCwd}} | {{tokenCountColored}}'
```

## Command Options

- `-t, --template <string>` - Mustache template string
- `--no-color` - Disable ANSI colors
- `-d, --debug` - Debug mode - show input data
- `-h, --help` - Display help

## Performance Notes

- Token data is read from stdin (no file I/O required)
- Git functions use lazy evaluation (only calculated when used in template)
- Git info from stdin is preferred over command execution for better performance

## License

MIT