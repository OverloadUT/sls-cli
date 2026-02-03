#!/usr/bin/env node

/**
 * SLS - Spectra Listing System CLI
 * A semantic directory listing tool for AI agents
 */

import { Command } from 'commander';
import { createRequire } from 'module';
import { listCommand } from './commands/list.js';
import { SLS_SPEC } from './lib/spec.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const program = new Command();

program
  .name('sls')
  .description('Spectra Listing System - semantic directory listing for AI agents')
  .version(version, '-v, --version');

program
  .argument('[path]', 'Directory or file path to list', '.')
  .option('--json', 'Output as JSON instead of tree')
  .option('--depth <number>', 'Override maximum traversal depth', (value) => parseInt(value, 10))
  .option('--validate', 'Validate structure against schemas')
  .option('--audit', 'Show metadata sources (local vs schema)')
  .option('--summary', 'Include summary fields in output')
  .option('--no-height', 'Omit height context box')
  .option('-a, --all', 'Show hidden and ignored files')
  .option('--debug', 'Enable debug output to stderr')
  .option('--spec', 'Output the full SLS specification')
  .action(async (path, options) => {
    if (options.spec) {
      console.log(SLS_SPEC);
      return;
    }
    await listCommand(path, options);
  });

program.parse();
