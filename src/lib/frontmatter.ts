/**
 * Front matter parsing from markdown files
 */

import matter from 'gray-matter';
import * as fs from 'fs';
import { FrontMatter, Schema, SchemaChild } from '../types.js';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_READ_SIZE = 64 * 1024; // Read first 64KB for front matter (schemas can be large)

/**
 * Parse schema child from raw data
 */
function parseSchemaChild(data: unknown): SchemaChild | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as Record<string, unknown>;
  const child: SchemaChild = {};

  if (typeof raw.name === 'string') {
    child.name = raw.name;
  }

  if (typeof raw.pattern === 'string') {
    child.pattern = raw.pattern;
  }

  if (raw.type === 'file' || raw.type === 'directory') {
    child.type = raw.type;
  }

  if (typeof raw.required === 'boolean') {
    child.required = raw.required;
  }

  if (typeof raw.description === 'string') {
    child.description = raw.description;
  }

  if (typeof raw['sls:depth'] === 'number') {
    child['sls:depth'] = raw['sls:depth'];
  }

  if (typeof raw['sls:height'] === 'number') {
    child['sls:height'] = raw['sls:height'];
  }

  if (Array.isArray(raw.children)) {
    child.children = raw.children
      .map(parseSchemaChild)
      .filter((c): c is SchemaChild => c !== null);
  }

  // Must have at least name or pattern
  if (!child.name && !child.pattern) {
    return null;
  }

  return child;
}

/**
 * Parse schema from raw data
 */
function parseSchema(data: unknown): Schema | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as Record<string, unknown>;

  if (!Array.isArray(raw.children)) {
    return null;
  }

  const children = raw.children
    .map(parseSchemaChild)
    .filter((c): c is SchemaChild => c !== null);

  if (children.length === 0) {
    return null;
  }

  return { children };
}

/**
 * Parse front matter from a markdown file
 * Returns empty object if parsing fails (graceful degradation)
 */
export function parseFrontMatter(filePath: string): FrontMatter {
  try {
    // Check file size
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      // Skip large files
      return {};
    }

    // Read only the first part of the file for performance
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(Math.min(MAX_READ_SIZE, stats.size));
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);

    const content = buffer.toString('utf-8');

    // Parse front matter
    const result = matter(content);

    // Extract only the fields we care about
    const frontMatter: FrontMatter = {};

    if (typeof result.data.description === 'string') {
      frontMatter.description = result.data.description;
    }

    if (typeof result.data.summary === 'string') {
      frontMatter.summary = result.data.summary;
    }

    if (result.data['sls:depth'] !== undefined) {
      const depth = Number(result.data['sls:depth']);
      if (!isNaN(depth)) {
        frontMatter['sls:depth'] = depth;
      }
    }

    if (result.data['sls:height'] !== undefined) {
      const height = Number(result.data['sls:height']);
      if (!isNaN(height)) {
        frontMatter['sls:height'] = height;
      }
    }

    if (result.data['sls:ignore'] !== undefined) {
      frontMatter['sls:ignore'] = Boolean(result.data['sls:ignore']);
    }

    if (result.data['sls:schema']) {
      const schema = parseSchema(result.data['sls:schema']);
      if (schema) {
        frontMatter['sls:schema'] = schema;
      }
    }

    return frontMatter;
  } catch (error) {
    // Graceful degradation - log error to stderr but continue
    if (process.env.DEBUG) {
      console.error(`Warning: Failed to parse front matter from ${filePath}:`, error);
    }
    return {};
  }
}
