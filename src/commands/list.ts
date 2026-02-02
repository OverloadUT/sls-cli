/**
 * List command implementation
 */

import { validatePath, validateDepth, validateFilter } from '../lib/validation.js';
import { traverseDirectory } from '../lib/traverse.js';
import { formatJSON, formatTree } from '../lib/output.js';
import { outputError } from '../lib/errors.js';
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

    if (options.filter) {
      validateFilter(options.filter);
    }

    // Convert options to CLI options
    const cliOptions: CLIOptions = {
      human: options.human,
      depth: options.depth,
      noDescriptions: options.noDescriptions,
      filter: options.filter,
      showIgnored: options.showIgnored,
      debug: options.debug,
    };

    // Traverse directory
    const entry = await traverseDirectory(resolvedPath, cliOptions);

    // Format and output
    if (options.human) {
      console.log(formatTree(entry));
    } else {
      console.log(formatJSON(entry));
    }

    process.exit(0);
  } catch (error: any) {
    if (error.code) {
      // It's an SLSError
      outputError(
        error.code as ErrorCode,
        error.message,
        error.suggestion || 'Check the error message and try again',
        error.context || {},
        error.code === ErrorCode.INVALID_PATH ? 4 : 1
      );
    } else {
      // Unexpected error
      outputError(
        ErrorCode.INVALID_PATH,
        `Unexpected error: ${error.message}`,
        'Please report this issue',
        { error: String(error) },
        1
      );
    }
  }
}
