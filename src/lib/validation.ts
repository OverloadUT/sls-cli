/**
 * Input validation
 */

import { ErrorCode } from '../types.js';
import { SLSError } from './errors.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validate and normalize a file path
 * @throws {SLSError} if path is invalid or doesn't exist
 */
export function validatePath(inputPath: string): string {
  // Resolve to absolute path
  const resolvedPath = path.resolve(inputPath);

  // Check for path traversal attempts
  if (resolvedPath.includes('..')) {
    throw new SLSError(
      ErrorCode.INVALID_PATH,
      'Path traversal is not allowed',
      'Use absolute paths or paths relative to current directory',
      { inputPath, resolvedPath }
    );
  }

  // Check if path exists
  if (!fs.existsSync(resolvedPath)) {
    throw new SLSError(
      ErrorCode.INVALID_PATH,
      `Path does not exist: ${resolvedPath}`,
      'Check the path and try again',
      { inputPath, resolvedPath }
    );
  }

  return resolvedPath;
}

/**
 * Validate depth parameter
 * @throws {SLSError} if depth is invalid
 */
export function validateDepth(depth: number): void {
  if (!Number.isInteger(depth) || depth < 1 || depth > 10) {
    throw new SLSError(
      ErrorCode.INVALID_DEPTH,
      `Depth must be an integer between 1 and 10, got: ${depth}`,
      'Use --depth with a value between 1 and 10',
      { depth }
    );
  }
}

/**
 * Validate glob filter pattern
 * @throws {SLSError} if pattern is invalid
 */
export function validateFilter(filter: string): void {
  // Basic validation - just check it's not empty
  if (!filter || filter.trim().length === 0) {
    throw new SLSError(
      ErrorCode.INVALID_FILTER,
      'Filter pattern cannot be empty',
      'Provide a valid glob pattern like "*.md"',
      { filter }
    );
  }
}
