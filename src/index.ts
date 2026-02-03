#!/usr/bin/env node

/**
 * SLS - Spectra Listing System CLI
 * A semantic directory listing tool for AI agents
 */

import { Command } from 'commander';
import { listCommand } from './commands/list.js';

const program = new Command();

program
  .name('sls')
  .description('Spectra Listing System - semantic directory listing for AI agents')
  .version('0.2.0');

program
  .argument('[path]', 'Directory or file path to list', '.')
  .option('--human', 'Force human-readable tree output')
  .option('--json', 'Force JSON output')
  .option('--depth <number>', 'Override maximum traversal depth', (value) => parseInt(value, 10))
  .option('--validate', 'Validate structure against schemas')
  .option('--audit', 'Show metadata sources (local vs schema)')
  .option('--summary', 'Include summary fields in output')
  .option('--no-height', 'Omit height context box')
  .option('--show-ignored', 'Show ignored files and directories')
  .option('--debug', 'Enable debug output to stderr')
  .action(async (path, options) => {
    await listCommand(path, options);
  });

program.parse();
