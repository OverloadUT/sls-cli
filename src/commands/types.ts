/**
 * Command-specific types
 */

export interface ListCommandOptions {
  json?: boolean;
  depth?: number;
  validate?: boolean;
  audit?: boolean;
  summary?: boolean;
  height?: boolean;  // Commander.js sets this to false when --no-height is used
  all?: boolean;  // show hidden and ignored files
  debug?: boolean;
}
