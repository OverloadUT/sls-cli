/**
 * Global type definitions for sls CLI
 */

/** Directory or file entry with metadata */
export interface DirectoryEntry {
  path: string;
  type: 'file' | 'directory';
  description?: string;
  purpose?: string;
  tags?: string[];
  modified: string; // ISO 8601 timestamp
  size?: number; // Bytes (files only)
  children?: DirectoryEntry[]; // Directories only
}

/** Front matter from README.md or markdown files */
export interface FrontMatter {
  description?: string;
  purpose?: string;
  tags?: string[];
  'sls:depth'?: number;
  'sls:context'?: string;
  'sls:ignore'?: boolean;
}

/** Success output */
export interface SuccessOutput {
  success: true;
  path: string;
  type: 'directory' | 'file';
  description?: string;
  purpose?: string;
  tags?: string[];
  modified: string;
  size?: number;
  children?: DirectoryEntry[];
}

/** Error output */
export interface ErrorOutput {
  success: false;
  error: {
    code: string;
    message: string;
    suggestion: string;
    context: Record<string, unknown>;
  };
}

/** CLI options */
export interface CLIOptions {
  human?: boolean;
  depth?: number;
  noDescriptions?: boolean;
  filter?: string;
  showIgnored?: boolean;
  debug?: boolean;
}

/** Error codes */
export enum ErrorCode {
  INVALID_PATH = 'INVALID_PATH',
  INVALID_DEPTH = 'INVALID_DEPTH',
  PARSE_ERROR = 'PARSE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_FILTER = 'INVALID_FILTER',
}
