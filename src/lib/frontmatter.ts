/**
 * Front matter parsing from markdown files
 */

import matter from 'gray-matter';
import * as fs from 'fs';
import { FrontMatter } from '../types.js';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_READ_SIZE = 5 * 1024; // Read only first 5KB for front matter

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

    if (result.data.description) {
      frontMatter.description = String(result.data.description);
    }

    if (result.data.purpose) {
      frontMatter.purpose = String(result.data.purpose);
    }

    if (result.data.tags && Array.isArray(result.data.tags)) {
      frontMatter.tags = result.data.tags.map(String);
    }

    if (result.data['sls:depth']) {
      const depth = Number(result.data['sls:depth']);
      if (!isNaN(depth)) {
        frontMatter['sls:depth'] = depth;
      }
    }

    if (result.data['sls:context']) {
      frontMatter['sls:context'] = String(result.data['sls:context']);
    }

    if (result.data['sls:ignore'] !== undefined) {
      frontMatter['sls:ignore'] = Boolean(result.data['sls:ignore']);
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
