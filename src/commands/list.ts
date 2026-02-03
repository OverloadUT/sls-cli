/**
 * List command implementation
 */

import * as path from 'path';
import { validatePath, validateDepth } from '../lib/validation.js';
import { traverseDirectory } from '../lib/traverse.js';
import { formatJSON, formatTree } from '../lib/output.js';
import { outputError } from '../lib/errors.js';
import { getSpectraRoot, buildHeightContext, resolveHeight } from '../lib/height.js';
import { validateStructure, formatValidationResults } from '../lib/schema.js';
import { ErrorCode, CLIOptions } from '../types.js';
import { ListCommandOptions } from './types.js';

/**
 * Execute the list command
 */
export async function listCommand(targetPath: string, options: ListCommandOptions): Promise<void> {
  try {
    // Set debug mode if requested
    if (options.debug) {
      process.env.DEBUG = '1';
    }

    // Validate inputs
    const resolvedPath = validatePath(targetPath);

    if (options.depth !== undefined) {
      validateDepth(options.depth);
    }

    // Get SPECTRA_ROOT
    const spectraRoot = getSpectraRoot();

    // Handle validation mode
    if (options.validate) {
      const summary = validateStructure(resolvedPath, spectraRoot);
      const output = formatValidationResults(summary, spectraRoot || resolvedPath);

      console.log(`Validating ${targetPath}...\n`);
      console.log(output);

      if (summary.failed > 0) {
        process.exit(1);
      }
      process.exit(0);
    }

    // Convert options to CLI options
    const cliOptions: CLIOptions = {
      human: options.human,
      json: options.json,
      depth: options.depth,
      audit: options.audit,
      summary: options.summary,
      height: options.height,
      showIgnored: options.showIgnored,
      debug: options.debug,
    };

    // Traverse directory
    const entry = await traverseDirectory(resolvedPath, {
      cliOptions,
      spectraRoot,
      audit: options.audit,
    });

    // Build height context if not disabled (options.height is false when --no-height is used)
    let heightContext = null;
    if (options.height !== false && spectraRoot) {
      const heightLevels = resolveHeight(resolvedPath, spectraRoot);
      if (heightLevels > 0) {
        heightContext = buildHeightContext(resolvedPath, heightLevels, spectraRoot);
      }
    }

    // Format and output
    // Default to human-readable for TTY, JSON otherwise
    const useHuman = options.human || (!options.json && process.stdout.isTTY);

    if (useHuman) {
      console.log(formatTree(entry, heightContext || undefined, options.audit));
    } else {
      console.log(formatJSON(entry, heightContext || undefined));
    }

    process.exit(0);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string; suggestion?: string; context?: Record<string, unknown> };

    if (err.code) {
      // It's an SLSError
      outputError(
        err.code as ErrorCode,
        err.message || 'Unknown error',
        err.suggestion || 'Check the error message and try again',
        err.context || {},
        err.code === ErrorCode.INVALID_PATH ? 4 : 1
      );
    } else {
      // Unexpected error
      outputError(
        ErrorCode.INVALID_PATH,
        `Unexpected error: ${err.message || String(error)}`,
        'Please report this issue',
        { error: String(error) },
        1
      );
    }
  }
}
