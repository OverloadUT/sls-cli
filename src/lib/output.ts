/**
 * Output formatting (JSON and human-readable tree)
 */

import { DirectoryEntry, SuccessOutput } from '../types.js';

/**
 * Format output as JSON
 */
export function formatJSON(entry: DirectoryEntry): string {
  const output: SuccessOutput = {
    success: true,
    path: entry.path,
    type: entry.type,
    modified: entry.modified,
  };

  if (entry.description) output.description = entry.description;
  if (entry.purpose) output.purpose = entry.purpose;
  if (entry.tags) output.tags = entry.tags;
  if (entry.size !== undefined) output.size = entry.size;
  if (entry.children) output.children = entry.children;

  return JSON.stringify(output, null, 2);
}

/**
 * Format output as human-readable tree
 */
export function formatTree(entry: DirectoryEntry, prefix: string = '', isLast: boolean = true): string {
  let output = '';

  // Root entry
  if (prefix === '') {
    output += `${entry.path}${entry.type === 'directory' ? '/' : ''}\n`;
    if (entry.description) {
      output += `│ ${entry.description}\n`;
    }
    if (entry.purpose) {
      output += `│ Purpose: ${entry.purpose}\n`;
    }
    if (entry.tags && entry.tags.length > 0) {
      output += `│ Tags: ${entry.tags.join(', ')}\n`;
    }
    if (entry.description || entry.purpose || entry.tags) {
      output += `│\n`;
    }
  } else {
    // Child entry
    const connector = isLast ? '└─' : '├─';
    const childPrefix = isLast ? '   ' : '│  ';

    output += `${prefix}${connector} ${entry.path}${entry.type === 'directory' ? '/' : ''}\n`;

    if (entry.description) {
      output += `${prefix}${childPrefix}└─ ${entry.description}\n`;
    }
    if (entry.purpose) {
      output += `${prefix}${childPrefix}   Purpose: ${entry.purpose}\n`;
    }
    if (entry.tags && entry.tags.length > 0) {
      output += `${prefix}${childPrefix}   Tags: ${entry.tags.join(', ')}\n`;
    }

    prefix = prefix + childPrefix;
  }

  // Recursively format children
  if (entry.children && entry.children.length > 0) {
    entry.children.forEach((child, index) => {
      const isLastChild = index === entry.children!.length - 1;
      const childPrefix = prefix === '' ? '' : prefix;
      output += formatTree(child, childPrefix, isLastChild);
    });
  }

  return output;
}
