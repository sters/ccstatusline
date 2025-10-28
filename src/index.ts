#!/usr/bin/env bun
import { program } from 'commander';
import chalk from 'chalk';
import { readStdin } from './lib/stdin.js';
import { processInput } from './lib/processor.js';
import { renderTemplateAsync, DEFAULT_TEMPLATE } from './lib/template.js';
import { StatuslineInput, CliOptions } from './lib/types.js';

async function main() {
  program
    .name('ccstatusline')
    .description('Claude Code statusline with Mustache template support')
    .version('1.0.0')
    .option('-t, --template <string>', 'Mustache template string')
    .option('--no-color', 'Disable ANSI colors')
    .option('-d, --debug', 'Debug mode - show input data')
    .parse(process.argv);

  const options = program.opts() as CliOptions;

  try {
    const inputStr = await readStdin();
    const input: StatuslineInput = inputStr.trim() ? JSON.parse(inputStr) : {};

    if (options.debug) {
      console.error(chalk.gray('Input data:'));
      console.error(JSON.stringify(input, null, 2));
    }

    const data = processInput(input);
    const template = options.template || DEFAULT_TEMPLATE;
    
    // Always use async rendering to support all template functions
    const rendered = await renderTemplateAsync(template, data);

    console.log(rendered);
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(chalk.red(`Fatal error: ${error}`));
  process.exit(1);
});
