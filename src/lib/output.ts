/**
 * Output formatting (JSON and human-readable tree)
 */

import { OutputEntry, SuccessOutput, HeightContext, AuditEntry, MetadataSource } from '../types.js';

/**
 * Format height context box for tree output
 */
function formatHeightBox(height: HeightContext): string {
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

/**
 * Format metadata source for audit output
 */
function formatSource(source: MetadataSource): string {
  if (source.type === 'local') {
    return '[local]';
  } else if (source.type === 'schema') {
    return `[schema: ${source.path}]`;
  } else {
    return '[default]';
  }
}

/**
 * Format output as JSON
 */
export function formatJSON(entry: OutputEntry, height?: HeightContext): string {
  const output: SuccessOutput = {
    entry: {
      name: entry.name,
      type: entry.type,
      modified: entry.modified,
    },
  };

  if (height) {
    output.height = height;
  }

  if (entry.description) output.entry.description = entry.description;
  if (entry.summary) output.entry.summary = entry.summary;
  if (entry.size !== undefined) output.entry.size = entry.size;
  if (entry.fileCount !== undefined) output.entry.fileCount = entry.fileCount;
  if (entry.children) output.entry.children = entry.children;

  return JSON.stringify(output, null, 2);
}

/**
 * Format output as human-readable tree
 */
export function formatTree(
  entry: OutputEntry,
  height?: HeightContext,
  audit?: boolean
): string {
  let output = '';

  // Add height box if present
  if (height && height.ancestors.length > 0) {
    output += formatHeightBox(height) + '\n\n';
  }

  // Format the tree
  output += formatTreeNode(entry, '', true, true, audit);

  return output;
}

/**
 * Truncate description for inline display
 */
function truncateDesc(desc: string, maxLen: number = 50): string {
  if (desc.length <= maxLen) return desc;
  return desc.substring(0, maxLen - 3) + '...';
}

/**
 * Format a single tree node and its children
 */
function formatTreeNode(
  entry: OutputEntry | AuditEntry,
  prefix: string,
  isRoot: boolean,
  isLast: boolean,
  audit?: boolean
): string {
  let output = '';

  if (isRoot) {
    // Root entry - name on first line
    let nameLine = `${entry.name}${entry.type === 'directory' ? '/' : ''}`;

    // Add description inline with arrow
    if (entry.description) {
      nameLine += `  ← ${truncateDesc(entry.description)}`;
      if (audit && (entry as AuditEntry).descriptionSource) {
        nameLine += ` ${formatSource((entry as AuditEntry).descriptionSource!)}`;
      }
    }

    // Add file count for collapsed dirs
    if (entry.fileCount !== undefined) {
      nameLine += ` (${entry.fileCount} file${entry.fileCount === 1 ? '' : 's'})`;
    }

    output += nameLine + '\n';

    if (audit && (entry as AuditEntry).depthSource) {
      output += `│ depth: ${formatSource((entry as AuditEntry).depthSource!)}\n`;
    }

    // Show truncation indicator if truncated at root level
    if (entry.truncated) {
      output += `└── ...\n`;
    }
  } else {
    // Child entry
    const connector = isLast ? '└── ' : '├── ';

    let nameLine = `${prefix}${connector}${entry.name}`;
    if (entry.type === 'directory') {
      nameLine += '/';
    }

    // Add description inline with arrow
    if (entry.description) {
      nameLine += `  ← ${truncateDesc(entry.description)}`;
      if (audit && (entry as AuditEntry).descriptionSource) {
        nameLine += ` ${formatSource((entry as AuditEntry).descriptionSource!)}`;
      }
    }

    // Add file count for collapsed dirs
    if (entry.fileCount !== undefined) {
      nameLine += ` (${entry.fileCount} file${entry.fileCount === 1 ? '' : 's'})`;
    }

    output += nameLine + '\n';

    const childPrefix = prefix + (isLast ? '    ' : '│   ');

    if (audit && (entry as AuditEntry).depthSource) {
      output += `${childPrefix}depth: ${formatSource((entry as AuditEntry).depthSource!)}\n`;
    }

    // Show truncation indicator for directories that have more content
    if (entry.type === 'directory' && entry.truncated) {
      output += `${childPrefix}└── ...\n`;
    }
  }

  // Recursively format children
  if (entry.children && entry.children.length > 0) {
    const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');

    entry.children.forEach((child, index) => {
      const isLastChild = index === entry.children!.length - 1;
      output += formatTreeNode(child, childPrefix, false, isLastChild, audit);
    });
  }

  return output;
}

/**
 * Format validation output
 */
export function formatValidation(
  passed: number,
  failed: number,
  results: Array<{ path: string; exists: boolean; required: boolean }>
): string {
  const lines: string[] = [];

  for (const result of results) {
    const status = result.exists ? '✓' : '✗';
    const action = result.exists ? 'exists' : 'missing';
    const suffix = result.required ? '(required)' : '';
    lines.push(`  ${status} ${result.path} ${action} ${suffix}`);
  }

  lines.push('');
  const status = failed === 0 ? 'passed' : 'failed';
  lines.push(`Validation ${status}: ${passed + failed} checks, ${failed} errors`);

  return lines.join('\n');
}
