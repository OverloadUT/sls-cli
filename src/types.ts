/**
 * Global type definitions for SLS CLI
 */

// ============================================================================
// Schema Types
// ============================================================================

/** Schema child definition - can match by name or pattern */
export interface SchemaChild {
  name?: string;
  pattern?: string;
  type?: 'file' | 'directory';
  required?: boolean;
  description?: string;
  'sls:depth'?: number;
  'sls:height'?: number;
  children?: SchemaChild[];
}

/** Schema definition from front matter */
export interface Schema {
  children: SchemaChild[];
}

// ============================================================================
// Front Matter Types
// ============================================================================

/** Front matter from README.md or markdown files */
export interface FrontMatter {
  description?: string;
  summary?: string;
  'sls:depth'?: number;
  'sls:height'?: number;
  'sls:ignore'?: boolean;
  'sls:schema'?: Schema;
}

// ============================================================================
// Height / Ancestry Types
// ============================================================================

/** Single ancestor in the height context */
export interface Ancestor {
  name: string;
  description?: string;
}

/** Height context showing path and ancestry */
export interface HeightContext {
  path: string;
  ancestors: Ancestor[];
}

// ============================================================================
// Output Entry Types
// ============================================================================

/** Directory or file entry with metadata */
export interface OutputEntry {
  name: string;
  type: 'file' | 'directory';
  description?: string;
  summary?: string;
  modified: string;
  size?: number;
  fileCount?: number;
  truncated?: boolean;  // true when children not shown due to depth limit
  truncatedCount?: number;  // number of children omitted when truncated
  children?: OutputEntry[];
}

/** Success output with optional height context */
export interface SuccessOutput {
  height?: HeightContext;
  entry: OutputEntry;
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

// ============================================================================
// Audit Types
// ============================================================================

/** Source of a metadata value */
export type MetadataSource =
  | { type: 'local' }
  | { type: 'schema'; path: string }
  | { type: 'default' };

/** Entry with audit information about metadata sources */
export interface AuditEntry extends OutputEntry {
  descriptionSource?: MetadataSource;
  depthSource?: MetadataSource;
  heightSource?: MetadataSource;
}

// ============================================================================
// Validation Types
// ============================================================================

/** Single validation result */
export interface ValidationResult {
  path: string;
  schemaPath: string;
  required: boolean;
  exists: boolean;
}

/** Validation summary */
export interface ValidationSummary {
  results: ValidationResult[];
  passed: number;
  failed: number;
}

// ============================================================================
// CLI Types
// ============================================================================

/** CLI options */
export interface CLIOptions {
  json?: boolean;
  depth?: number;
  validate?: boolean;
  audit?: boolean;
  summary?: boolean;
  height?: boolean;  // false when --no-height is used
  all?: boolean;  // show hidden and ignored files
  debug?: boolean;
}

/** Error codes */
export enum ErrorCode {
  INVALID_PATH = 'INVALID_PATH',
  INVALID_DEPTH = 'INVALID_DEPTH',
  PARSE_ERROR = 'PARSE_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_FILTER = 'INVALID_FILTER',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

// ============================================================================
// Internal Types (used during traversal)
// ============================================================================

/** Resolved defaults from schema chain */
export interface ResolvedDefaults {
  description?: string;
  depth?: number;
  height?: number;
  source?: {
    description?: MetadataSource;
    depth?: MetadataSource;
    height?: MetadataSource;
  };
}

/** Context passed through traversal */
export interface TraversalContext {
  spectraRoot: string | null;
  options: CLIOptions;
  schemaChain: Array<{ path: string; schema: Schema }>;
}
