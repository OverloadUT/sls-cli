/**
 * Height context and ancestry handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { HeightContext, Ancestor } from '../types.js';
import { parseFrontMatter } from './frontmatter.js';
import { resolveDefaults } from './schema.js';

/**
 * Get SPECTRA_ROOT from environment, or auto-detect from query path
 * Auto-detection walks up from the query path looking for a README.md with sls:schema
 */
export function getSpectraRoot(queryPath?: string): string | null {
  // First check environment variable
  const envRoot = process.env.SPECTRA_ROOT;
  if (envRoot) {
    const resolved = path.resolve(envRoot);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  // Auto-detect by walking up from query path
  if (queryPath) {
    let currentPath = path.resolve(queryPath);

    // If queryPath is a file, start from its directory
    if (fs.existsSync(currentPath) && fs.statSync(currentPath).isFile()) {
      currentPath = path.dirname(currentPath);
    }

    while (currentPath !== path.dirname(currentPath)) {
      const readmePath = path.join(currentPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        const fm = parseFrontMatter(readmePath);
        if (fm['sls:schema']) {
          // Found a directory with a schema - use this as root
          return currentPath;
        }
      }
      currentPath = path.dirname(currentPath);
    }
  }

  return null;
}

/**
 * Get description for an ancestor directory
 * Checks local front matter first, then schema defaults
 */
export function getAncestorDescription(
  ancestorPath: string,
  spectraRoot: string | null
): string | undefined {
  const readmePath = path.join(ancestorPath, 'README.md');

  // First check local front matter
  if (fs.existsSync(readmePath)) {
    const fm = parseFrontMatter(readmePath);
    if (fm.description) {
      return fm.description;
    }
  }

  // Fall back to schema defaults
  if (spectraRoot) {
    const defaults = resolveDefaults(
      ancestorPath,
      path.basename(ancestorPath),
      'directory',
      spectraRoot
    );
    if (defaults.description) {
      return defaults.description;
    }
  }

  return undefined;
}

/**
 * Build height context for an entry
 *
 * @param entryPath - Absolute path to the entry
 * @param heightLevels - Number of ancestor levels to include
 * @param spectraRoot - SPECTRA_ROOT path (optional)
 * @returns HeightContext or null if no context available
 */
export function buildHeightContext(
  entryPath: string,
  heightLevels: number,
  spectraRoot: string | null
): HeightContext | null {
  if (heightLevels <= 0) {
    return null;
  }

  if (!spectraRoot) {
    return null;
  }

  const normalizedEntry = path.resolve(entryPath);
  const normalizedRoot = path.resolve(spectraRoot);

  // Get relative path from root
  const relPath = path.relative(normalizedRoot, normalizedEntry);
  if (relPath.startsWith('..')) {
    // Entry is outside SPECTRA_ROOT
    return null;
  }

  // Build ancestors list (from immediate parent going up)
  const ancestors: Ancestor[] = [];
  let currentPath = path.dirname(normalizedEntry);
  let levelsCollected = 0;

  while (
    levelsCollected < heightLevels &&
    currentPath.length >= normalizedRoot.length &&
    currentPath.startsWith(normalizedRoot)
  ) {
    const name = path.basename(currentPath);
    if (!name || currentPath === normalizedRoot) {
      // Reached the root, don't include it as an ancestor
      break;
    }

    const description = getAncestorDescription(currentPath, spectraRoot);
    ancestors.unshift({ name, description });

    currentPath = path.dirname(currentPath);
    levelsCollected++;
  }

  return {
    path: relPath,
    ancestors,
  };
}

/**
 * Resolve the effective height for an entry
 * Checks local front matter, then schema defaults, then returns 0
 */
export function resolveHeight(
  entryPath: string,
  spectraRoot: string | null
): number {
  // Check local front matter
  const readmePath = entryPath.endsWith('README.md')
    ? entryPath
    : path.join(entryPath, 'README.md');

  if (fs.existsSync(readmePath)) {
    const fm = parseFrontMatter(readmePath);
    if (fm['sls:height'] !== undefined) {
      return fm['sls:height'];
    }
  }

  // Check schema defaults
  if (spectraRoot) {
    const defaults = resolveDefaults(
      entryPath,
      path.basename(entryPath),
      'directory',
      spectraRoot
    );
    if (defaults.height !== undefined) {
      return defaults.height;
    }
  }

  // Default: no height context
  return 0;
}

/**
 * Format height context box for tree output
 */
export function formatHeightBox(height: HeightContext): string {
  const lines: string[] = [];
  const width = 55;

  lines.push('╭─ Height ' + '─'.repeat(width - 10) + '╮');
  lines.push('│ ' + height.path.padEnd(width - 3) + '│');
  lines.push('│' + ' '.repeat(width - 1) + '│');

  for (const ancestor of height.ancestors) {
    const desc = ancestor.description || '(no description)';
    const line = `${ancestor.name}: ${desc}`;
    const truncated = line.length > width - 4
      ? line.substring(0, width - 7) + '...'
      : line;
    lines.push('│ ' + truncated.padEnd(width - 3) + '│');
  }

  lines.push('╰' + '─'.repeat(width - 1) + '╯');

  return lines.join('\n');
}
