/**
 * Error handling and structured error output
 */

import { ErrorOutput, ErrorCode } from '../types.js';

/**
 * Output a structured error to stderr and exit
 */
export function outputError(
  code: ErrorCode,
  message: string,
  suggestion: string,
  context: Record<string, unknown> = {},
  exitCode: number = 1
): never {
  const errorOutput: ErrorOutput = {
    success: false,
    error: {
      code,
      message,
      suggestion,
      context,
    },
  };

  console.error(JSON.stringify(errorOutput, null, 2));
  process.exit(exitCode);
}

/**
 * Custom error class for sls errors
 */
export class SLSError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public suggestion: string,
    public context: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'SLSError';
  }
}
