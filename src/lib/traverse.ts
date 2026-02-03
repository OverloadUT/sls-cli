/**
 * Directory traversal logic with schema integration
 */

import * as fs from 'fs';
import * as path from 'path';
import { OutputEntry, CLIOptions, AuditEntry, MetadataSource } from '../types.js';
import { parseFrontMatter } from './frontmatter.js';
import { createIgnoreFilter, isHidden } from './ignore.js';
import { resolveDefaults } from './schema.js';

interface TraverseOptions {
  cliOptions: CLIOptions;
  spectraRoot: string | null;
  audit?: boolean;
}

/**
 * Count items in a directory (non-recursive, excluding README.md and hidden files)
 * Returns { files, directories, total }
 */
function countItems(dirPath: string, spectraRoot: string | null, showAll: boolean = false): { files: number; directories: number; total: number } {
  try {
    const items = fs.readdirSync(dirPath);
    const ig = createIgnoreFilter(dirPath, spectraRoot || undefined);

    let files = 0;
    let directories = 0;

    for (const item of items) {
      // Skip hidden files unless showAll
      if (isHidden(item) && !showAll) continue;

      // Skip ignored items
      if (ig.ignores(item)) continue;

      // Skip README.md (it's metadata, not content)
      if (item === 'README.md') continue;

      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isFile()) {
        files++;
      } else if (stats.isDirectory()) {
        directories++;
      }
    }

    return { files, directories, total: files + directories };
  } catch {
    return { files: 0, directories: 0, total: 0 };
  }
}

/**
 * Traverse a directory and build the entry tree
 */
export async function traverseDirectory(
  dirPath: string,
  options: TraverseOptions,
  currentDepth: number = 0,
  effectiveMaxDepth: number | null = null,
  visitedInodes: Set<number> = new Set()
): Promise<OutputEntry | AuditEntry> {
  const { cliOptions, spectraRoot, audit } = options;
  const stats = fs.statSync(dirPath);
  const modified = stats.mtime.toISOString();
  const entryName = path.basename(dirPath);

  // Detect symlink loops
  const inode = stats.ino;
  if (visitedInodes.has(inode)) {
    return {
      name: entryName,
      type: 'directory',
      modified,
      description: '(symlink loop detected)',
    };
  }
  visitedInodes.add(inode);

  // Resolve defaults from schema
  const entryType = stats.isFile() ? 'file' : 'directory';
  const defaults = resolveDefaults(dirPath, entryName, entryType, spectraRoot);

  // Check if it's a file
  if (stats.isFile()) {
    const entry: OutputEntry | AuditEntry = {
      name: entryName,
      type: 'file',
      modified,
      size: stats.size,
    };

    // Get description from local front matter or schema default
    let description: string | undefined;
    let descriptionSource: MetadataSource | undefined;

    if (dirPath.endsWith('.md')) {
      const frontMatter = parseFrontMatter(dirPath);
      if (frontMatter.description) {
        description = frontMatter.description;
        descriptionSource = { type: 'local' };
      }
    }

    if (!description && defaults.description) {
      description = defaults.description;
      descriptionSource = defaults.source?.description;
    }

    if (description) {
      entry.description = description;
    }

    if (audit && descriptionSource) {
      (entry as AuditEntry).descriptionSource = descriptionSource;
    }

    return entry;
  }

  // It's a directory
  const entry: OutputEntry | AuditEntry = {
    name: entryName,
    type: 'directory',
    modified,
  };

  // Get description from local README or schema default
  let description: string | undefined;
  let descriptionSource: MetadataSource | undefined;
  let localDepth: number | undefined;
  let depthSource: MetadataSource | undefined;

  const readmePath = path.join(dirPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    const frontMatter = parseFrontMatter(readmePath);

    if (frontMatter.description) {
      description = frontMatter.description;
      descriptionSource = { type: 'local' };
    }

    if (frontMatter['sls:depth'] !== undefined) {
      localDepth = frontMatter['sls:depth'];
      depthSource = { type: 'local' };
    }

    if (frontMatter['sls:ignore']) {
      // This directory should be ignored - but we're already traversing it
      // This case is handled by the parent
    }
  }

  // Fall back to schema defaults
  if (!description && defaults.description) {
    description = defaults.description;
    descriptionSource = defaults.source?.description;
  }

  if (localDepth === undefined && defaults.depth !== undefined) {
    localDepth = defaults.depth;
    depthSource = defaults.source?.depth;
  }

  if (description) {
    entry.description = description;
  }

  if (audit) {
    if (descriptionSource) {
      (entry as AuditEntry).descriptionSource = descriptionSource;
    }
    if (depthSource) {
      (entry as AuditEntry).depthSource = depthSource;
    }
  }

  // Determine effective max depth for this subtree
  // - CLI depth option (if specified) sets initial max
  // - Local or schema sls:depth can OVERRIDE inherited limits (but only when not at root)
  let maxDepth = effectiveMaxDepth;
  if (maxDepth === null) {
    maxDepth = cliOptions.depth ?? 3;
  }

  // Check if we should stop here (depth 0 means just show this directory with count)
  // But if this is the root of the query (currentDepth === 0), always show contents
  if (localDepth === 0 && currentDepth > 0) {
    const counts = countItems(dirPath, spectraRoot, cliOptions.all);
    entry.fileCount = counts.total;
    return entry;
  }

  // If this directory has its own depth setting, it overrides the inherited limit
  // This allows nested directories to expand beyond their parent's depth
  // Only apply when not at the root query level (currentDepth > 0) OR when depth > 0
  if (localDepth !== undefined && (currentDepth > 0 || localDepth > 0)) {
    maxDepth = currentDepth + localDepth;
  }

  // For children, pass down this calculated max depth
  const subtreeMaxDepth = maxDepth;

  // Check depth limit
  if (currentDepth >= maxDepth) {
    // Mark as truncated with count of omitted items
    const counts = countItems(dirPath, spectraRoot, cliOptions.all);
    entry.truncated = true;
    entry.truncatedCount = counts.total;
    return entry;
  }

  // Read directory contents
  entry.children = [];

  try {
    const items = fs.readdirSync(dirPath);
    const ig = createIgnoreFilter(dirPath, spectraRoot || undefined);

    for (const item of items) {
      // Skip README.md in listings (it's metadata)
      if (item === 'README.md') continue;

      // Skip hidden files (starting with .) unless --all is used
      if (isHidden(item) && !cliOptions.all) {
        continue;
      }

      const itemPath = path.join(dirPath, item);

      // Check if should be ignored
      if (ig.ignores(item) && !cliOptions.all) {
        continue;
      }

      try {
        const itemStats = fs.statSync(itemPath);

        // Check for sls:ignore in front matter
        if (itemStats.isFile() && itemPath.endsWith('.md')) {
          const frontMatter = parseFrontMatter(itemPath);
          if (frontMatter['sls:ignore']) {
            continue;
          }
        }

        if (itemStats.isDirectory()) {
          const dirReadme = path.join(itemPath, 'README.md');
          if (fs.existsSync(dirReadme)) {
            const frontMatter = parseFrontMatter(dirReadme);
            if (frontMatter['sls:ignore']) {
              continue;
            }
          }
        }

        // Recursively traverse
        const childEntry = await traverseDirectory(
          itemPath,
          options,
          currentDepth + 1,
          subtreeMaxDepth,
          new Set(visitedInodes)
        );

        entry.children.push(childEntry);
      } catch (error) {
        if (process.env.DEBUG) {
          console.error(`Warning: Failed to process ${itemPath}:`, error);
        }
      }
    }

    // Sort children: directories first, then files, alphabetically within each group
    entry.children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
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
