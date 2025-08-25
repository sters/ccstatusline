# ccstatusline

A customizable statusline for Claude Code that supports Mustache templates with lazy-evaluated functions for token counting and compaction tracking.

## Features

- Mustache template support for customizable statusline
- Lazy-evaluated template functions for expensive operations
- Token count tracking from transcript files
- Compaction percentage calculation
- Color-coded output based on usage thresholds

## Installation

```bash
npm install -g ccstatusline
```

## Usage

Configure in `.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "ccstatusline --template '{{modelName}} | {{shortCwd}} | {{tokenCountColored}} ({{compactionPercentageColored}})'"
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
- `{{gitBranch}}` - Current git branch
- `{{gitStatus}}` - Git status
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

### Template Functions (Lazy-Evaluated)

These functions are only calculated when used in the template:

- `{{tokenCount}}` - Formatted token count (e.g., "1.2K", "2.5M")
- `{{tokenCountRaw}}` - Raw token count number
- `{{compactionPercentage}}` - Percentage until auto-compaction (0-100)
- `{{compactionPercentageColored}}` - Percentage with color coding:
  - Green: < 70%
  - Yellow: 70-89%
  - Red: ≥ 90%
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
ccstatusline --template '{{modelName}} | {{shortCwd}}'
```

### With token tracking
```bash
ccstatusline --template '{{modelName}} | {{tokenCount}} tokens ({{compactionPercentage}}%)'
```

### Color-coded with git info
```bash
ccstatusline --template '{{modelName}} | {{shortCwd}}{{#gitBranch}} ({{gitBranch}}){{/gitBranch}} | {{tokenCountColored}} ({{compactionPercentageColored}})'
```

### Full information
```bash
ccstatusline --template '{{modelName}} | {{shortCwd}} | {{gitBranch}} | Tokens: {{tokenCount}}/160K ({{compactionPercentage}}%) | Cost: {{totalCostUsd}}'
```

### With custom colors
```bash
ccstatusline --template '{{color:cyan,bold:Model}} {{modelName}} | {{color:yellow:Dir:}} {{shortCwd}} | {{tokenCountColored}}'
```

## Command Options

- `-t, --template <string>` - Mustache template string
- `--no-color` - Disable ANSI colors
- `-d, --debug` - Debug mode - show input data
- `-h, --help` - Display help

## Performance Notes

Token counting functions read and parse transcript files, which can be expensive. The implementation includes:
- Lazy evaluation (only calculated when used in template)
- Efficient JSONL parsing

## License

MIT