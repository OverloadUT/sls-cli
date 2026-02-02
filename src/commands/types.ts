/**
 * Command-specific types
 */

export interface ListCommandOptions {
  human?: boolean;
  depth?: number;
  noDescriptions?: boolean;
  filter?: string;
  showIgnored?: boolean;
  debug?: boolean;
}
