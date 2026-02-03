/**
 * Command-specific types
 */

export interface ListCommandOptions {
  human?: boolean;
  json?: boolean;
  depth?: number;
  validate?: boolean;
  audit?: boolean;
  summary?: boolean;
  height?: boolean;  // Commander.js sets this to false when --no-height is used
  showIgnored?: boolean;
  debug?: boolean;
}
