/**
 * Directory traversal logic
 */

import * as fs from 'fs';
import * as path from 'path';
import { DirectoryEntry, CLIOptions } from '../types.js';
import { parseFrontMatter } from './frontmatter.js';
import { createIgnoreFilter } from './ignore.js';
import { globby } from 'globby';

/**
 * Traverse a directory and build the entry tree
 */
export async function traverseDirectory(
  dirPath: string,
  options: CLIOptions,
  currentDepth: number = 0,
  visitedInodes: Set<number> = new Set()
): Promise<DirectoryEntry> {
  const stats = fs.statSync(dirPath);
  const modified = stats.mtime.toISOString();

  // Detect symlink loops
  const inode = stats.ino;
  if (visitedInodes.has(inode)) {
    // Symlink loop detected, return minimal entry
    return {
      path: path.basename(dirPath),
      type: 'directory',
      modified,
      description: '(symlink loop detected)',
    };
  }
  visitedInodes.add(inode);

  // Check if it's a file
  if (stats.isFile()) {
    const entry: DirectoryEntry = {
      path: path.basename(dirPath),
      type: 'file',
      modified,
      size: stats.size,
    };

    // Parse front matter if it's a markdown file and descriptions are enabled
    if (!options.noDescriptions && dirPath.endsWith('.md')) {
      const frontMatter = parseFrontMatter(dirPath);
      if (frontMatter.description) entry.description = frontMatter.description;
      if (frontMatter.purpose) entry.purpose = frontMatter.purpose;
      if (frontMatter.tags) entry.tags = frontMatter.tags;
    }

    return entry;
  }

  // It's a directory
  const entry: DirectoryEntry = {
    path: path.basename(dirPath),
    type: 'directory',
    modified,
    children: [],
  };

  // Try to read directory README.md for description
  if (!options.noDescriptions) {
    const readmePath = path.join(dirPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const frontMatter = parseFrontMatter(readmePath);
      if (frontMatter.description) entry.description = frontMatter.description;
      if (frontMatter.purpose) entry.purpose = frontMatter.purpose;
      if (frontMatter.tags) entry.tags = frontMatter.tags;

      // Check for sls:depth directive
      if (frontMatter['sls:depth'] !== undefined) {
        options.depth = frontMatter['sls:depth'];
      }
    }
  }

  // Check depth limit
  const maxDepth = options.depth ?? 3;
  if (currentDepth >= maxDepth) {
    return entry;
  }

  // Read directory contents
  try {
    const items = fs.readdirSync(dirPath);
    const ig = createIgnoreFilter(dirPath);

    // Apply filter if specified
    let filteredItems = items;
    if (options.filter) {
      const patterns = await globby(options.filter, {
        cwd: dirPath,
        onlyFiles: false,
        dot: true,
      });
      const filterSet = new Set(patterns.map((p) => path.basename(p)));
      filteredItems = items.filter((item) => filterSet.has(item));
    }

    for (const item of filteredItems) {
      const itemPath = path.join(dirPath, item);
      const relativePath = item;

      // Check if should be ignored
      const isIgnored = ig.ignores(relativePath);
      if (isIgnored && !options.showIgnored) {
        continue;
      }

      try {
        // Check for sls:ignore in front matter
        if (!options.noDescriptions && fs.statSync(itemPath).isFile() && itemPath.endsWith('.md')) {
          const frontMatter = parseFrontMatter(itemPath);
          if (frontMatter['sls:ignore']) {
            continue;
          }
        }

        // Recursively traverse
        const childEntry = await traverseDirectory(
          itemPath,
          options,
          currentDepth + 1,
          new Set(visitedInodes)
        );

        entry.children?.push(childEntry);
      } catch (error) {
        // Permission denied or other error - log and continue
        if (process.env.DEBUG) {
          console.error(`Warning: Failed to process ${itemPath}:`, error);
        }
      }
    }

    // Sort children: directories first, then files, alphabetically within each group
    entry.children?.sort((a, b) => {
      if (a.type === b.type) {
        return a.path.localeCompare(b.path);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    if (process.env.DEBUG) {
      console.error(`Warning: Failed to read directory ${dirPath}:`, error);
    }
  }

  return entry;
}
