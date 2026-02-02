/**
 * Handle .gitignore and .slsignore files
 */

import ignoreLib from 'ignore';
type Ignore = ReturnType<typeof ignoreLib>;
import * as fs from 'fs';
import * as path from 'path';

// Always ignore these patterns
const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  '.DS_Store',
  '*.swp',
  '*.swo',
];

/**
 * Create an ignore instance for a directory
 */
export function createIgnoreFilter(dirPath: string): Ignore {
  const ig = ignoreLib().add(DEFAULT_IGNORES);

  // Try to load .slsignore first (takes precedence)
  const slsignorePath = path.join(dirPath, '.slsignore');
  if (fs.existsSync(slsignorePath)) {
    try {
      const content = fs.readFileSync(slsignorePath, 'utf-8');
      ig.add(content);
    } catch (error) {
      if (process.env.DEBUG) {
        console.error(`Warning: Failed to read .slsignore:`, error);
      }
    }
  }

  // Load .gitignore if no .slsignore
  const gitignorePath = path.join(dirPath, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    try {
      const content = fs.readFileSync(gitignorePath, 'utf-8');
      ig.add(content);
    } catch (error) {
      if (process.env.DEBUG) {
        console.error(`Warning: Failed to read .gitignore:`, error);
      }
    }
  }

  return ig;
}

/**
 * Check if a path should be ignored
 */
export function shouldIgnore(ig: Ignore, relativePath: string): boolean {
  return ig.ignores(relativePath);
}
