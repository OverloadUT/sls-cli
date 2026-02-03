/**
 * Handle .gitignore and .slsignore files with cascading from ancestors
 */

import ignoreLib from 'ignore';
type Ignore = ReturnType<typeof ignoreLib>;
import * as fs from 'fs';
import * as path from 'path';

// Always ignore these patterns (only OS-level files)
const DEFAULT_IGNORES = [
  '.git',
  'node_modules',
  '.DS_Store',
  '*.swp',
  '*.swo',
  '.slsignore',
  '.gitignore',
];

/**
 * Create an ignore instance that cascades from root to the current directory
 */
export function createIgnoreFilter(dirPath: string, rootPath?: string): Ignore {
  const ig = ignoreLib().add(DEFAULT_IGNORES);

  // Collect all ancestor directories from root to current
  const dirsToCheck: string[] = [];
  let currentPath = path.resolve(dirPath);
  const resolvedRoot = rootPath ? path.resolve(rootPath) : null;

  // Walk up from current directory, collecting paths
  while (currentPath !== path.dirname(currentPath)) {
    dirsToCheck.unshift(currentPath); // Add to front so root is first

    // Stop at root if specified
    if (resolvedRoot && currentPath === resolvedRoot) {
      break;
    }

    currentPath = path.dirname(currentPath);
  }

  // Load ignore files from root to current (cascading)
  for (const dir of dirsToCheck) {
    // Try to load .slsignore first (takes precedence over .gitignore)
    const slsignorePath = path.join(dir, '.slsignore');
    if (fs.existsSync(slsignorePath)) {
      try {
        const content = fs.readFileSync(slsignorePath, 'utf-8');
        ig.add(content);
      } catch (error) {
        if (process.env.DEBUG) {
          console.error(`Warning: Failed to read .slsignore at ${dir}:`, error);
        }
      }
    }

    // Also load .gitignore
    const gitignorePath = path.join(dir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      try {
        const content = fs.readFileSync(gitignorePath, 'utf-8');
        ig.add(content);
      } catch (error) {
        if (process.env.DEBUG) {
          console.error(`Warning: Failed to read .gitignore at ${dir}:`, error);
        }
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

/**
 * Check if entry is a hidden file/directory (starts with .)
 */
export function isHidden(name: string): boolean {
  return name.startsWith('.');
}
