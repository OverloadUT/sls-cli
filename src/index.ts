#!/usr/bin/env node

/**
 * SLS - Semantic Directory Listing CLI
 * A tool for AI agents to explore directory structures with semantic metadata
 */

import { Command } from 'commander';
import { listCommand } from './commands/list.js';

const program = new Command();

program
  .name('sls')
  .description('Semantic directory listing tool for AI agents')
  .version('0.1.0');

program
  .argument('[path]', 'Directory or file path to list', '.')
  .option('--human', 'Output human-readable tree format instead of JSON')
  .option('--depth <number>', 'Maximum depth to traverse', (value) => parseInt(value, 10), 3)
  .option('--no-descriptions', 'Show structure only, skip metadata')
  .option('--filter <pattern>', 'Glob pattern to filter results')
  .option('--show-ignored', 'Show ignored files and directories')
  .option('--debug', 'Enable debug output to stderr')
  .action(async (path, options) => {
    await listCommand(path, options);
  });

program.parse();
