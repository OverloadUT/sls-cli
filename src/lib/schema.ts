/**
 * Schema parsing, matching, and validation
 */

import * as fs from 'fs';
import * as path from 'path';
import micromatch from 'micromatch';
import {
  Schema,
  SchemaChild,
  FrontMatter,
  ResolvedDefaults,
  MetadataSource,
  ValidationResult,
  ValidationSummary,
} from '../types.js';
import { parseFrontMatter } from './frontmatter.js';

/**
 * Match an entry name against a schema child definition
 */
export function matchSchemaChild(
  schemaChildren: SchemaChild[],
  entryName: string,
  entryType: 'file' | 'directory'
): SchemaChild | null {
  for (const child of schemaChildren) {
    // Check type match if specified
    if (child.type && child.type !== entryType) {
      continue;
    }

    // Check name match
    if (child.name && child.name === entryName) {
      return child;
    }

    // Check pattern match
    if (child.pattern && micromatch.isMatch(entryName, child.pattern)) {
      return child;
    }
  }

  return null;
}

/**
 * Collect schemas from all ancestor directories up to spectraRoot
 * Returns array from root to current, each with path and schema
 */
export function collectAncestorSchemas(
  entryPath: string,
  spectraRoot: string | null
): Array<{ path: string; schema: Schema; relativePath: string[] }> {
  const schemas: Array<{ path: string; schema: Schema; relativePath: string[] }> = [];

  if (!spectraRoot) {
    return schemas;
  }

  // Normalize paths
  const normalizedEntry = path.resolve(entryPath);
  const normalizedRoot = path.resolve(spectraRoot);

  // Walk from root to entry, collecting schemas
  let currentPath = normalizedRoot;
  const relativeParts: string[] = [];

  // Get relative path from root to entry
  const relPath = path.relative(normalizedRoot, normalizedEntry);
  const pathParts = relPath ? relPath.split(path.sep) : [];

  // Check root first
  const rootReadme = path.join(normalizedRoot, 'README.md');
  if (fs.existsSync(rootReadme)) {
    const fm = parseFrontMatter(rootReadme);
    if (fm['sls:schema']) {
      schemas.push({
        path: rootReadme,
        schema: fm['sls:schema'],
        relativePath: [],
      });
    }
  }

  // Walk through each directory level
  for (const part of pathParts) {
    currentPath = path.join(currentPath, part);
    relativeParts.push(part);

    const readmePath = path.join(currentPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const fm = parseFrontMatter(readmePath);
      if (fm['sls:schema']) {
        schemas.push({
          path: readmePath,
          schema: fm['sls:schema'],
          relativePath: [...relativeParts],
        });
      }
    }
  }

  return schemas;
}

/**
 * Navigate through a schema to find the child definition for a given path
 */
function navigateSchemaToPath(
  schema: Schema,
  pathParts: string[],
  entryType: 'file' | 'directory'
): SchemaChild | null {
  let currentChildren = schema.children;

  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    const isLast = i === pathParts.length - 1;
    const type = isLast ? entryType : 'directory';

    const match = matchSchemaChild(currentChildren, part, type);
    if (!match) {
      return null;
    }

    if (isLast) {
      return match;
    }

    if (!match.children) {
      return null;
    }

    currentChildren = match.children;
  }

  return null;
}

/**
 * Resolve defaults for an entry from the schema chain
 */
export function resolveDefaults(
  entryPath: string,
  entryName: string,
  entryType: 'file' | 'directory',
  spectraRoot: string | null
): ResolvedDefaults {
  const result: ResolvedDefaults = {
    source: {},
  };

  if (!spectraRoot) {
    return result;
  }

  const schemas = collectAncestorSchemas(path.dirname(entryPath), spectraRoot);

  for (const { path: schemaPath, schema, relativePath } of schemas) {
    // Calculate path from schema location to entry
    const entryRelPath = path.relative(
      path.dirname(schemaPath),
      entryPath
    );
    const parts = entryRelPath.split(path.sep).filter(p => p && p !== '.');

    const match = navigateSchemaToPath(schema, parts, entryType);

    if (match) {
      // Apply defaults if not already set
      if (match.description && !result.description) {
        result.description = match.description;
        result.source!.description = { type: 'schema', path: schemaPath };
      }

      if (match['sls:depth'] !== undefined && result.depth === undefined) {
        result.depth = match['sls:depth'];
        result.source!.depth = { type: 'schema', path: schemaPath };
      }

      if (match['sls:height'] !== undefined && result.height === undefined) {
        result.height = match['sls:height'];
        result.source!.height = { type: 'schema', path: schemaPath };
      }
    }
  }

  return result;
}

/**
 * Collect all schemas within a directory tree
 */
function collectAllSchemas(
  dirPath: string
): Array<{ path: string; schema: Schema }> {
  const schemas: Array<{ path: string; schema: Schema }> = [];

  function walkDir(currentPath: string): void {
    try {
      const readmePath = path.join(currentPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        const fm = parseFrontMatter(readmePath);
        if (fm['sls:schema']) {
          schemas.push({
            path: readmePath,
            schema: fm['sls:schema'],
          });
        }
      }

      const items = fs.readdirSync(currentPath);
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          // Skip common ignored directories
          if (item === '.git' || item === 'node_modules') continue;
          walkDir(itemPath);
        }
      }
    } catch {
      // Ignore errors (permissions, etc.)
    }
  }

  walkDir(dirPath);
  return schemas;
}

/**
 * Validate a directory structure against all applicable schemas
 */
export function validateStructure(
  dirPath: string,
  spectraRoot: string | null
): ValidationSummary {
  const results: ValidationResult[] = [];

  if (!spectraRoot) {
    return { results, passed: 0, failed: 0 };
  }

  // Collect ALL schemas within the tree being validated
  const schemas = collectAllSchemas(dirPath);

  // Validate each schema
  for (const { path: schemaPath, schema } of schemas) {
    const schemaDir = path.dirname(schemaPath);
    validateSchemaRecursive(schemaDir, schema.children, schemaPath, results);
  }

  const passed = results.filter(r => r.exists).length;
  const failed = results.filter(r => !r.exists && r.required).length;

  return { results, passed, failed };
}

/**
 * Recursively validate schema requirements
 */
function validateSchemaRecursive(
  basePath: string,
  children: SchemaChild[],
  schemaPath: string,
  results: ValidationResult[]
): void {
  for (const child of children) {
    if (child.name && child.required) {
      // Exact name match required
      const childPath = path.join(basePath, child.name);
      const exists = fs.existsSync(childPath);

      results.push({
        path: childPath,
        schemaPath,
        required: true,
        exists,
      });

      // If exists and has children schema, recurse
      if (exists && child.children) {
        validateSchemaRecursive(childPath, child.children, schemaPath, results);
      }
    } else if (child.pattern && child.children) {
      // Pattern match - find all matching directories and validate their children
      if (fs.existsSync(basePath) && fs.statSync(basePath).isDirectory()) {
        const entries = fs.readdirSync(basePath);
        for (const entry of entries) {
          if (micromatch.isMatch(entry, child.pattern)) {
            const entryPath = path.join(basePath, entry);
            if (fs.statSync(entryPath).isDirectory()) {
              validateSchemaRecursive(entryPath, child.children, schemaPath, results);
            }
          }
        }
      }
    }
  }
}

/**
 * Format validation results for display
 */
export function formatValidationResults(
  summary: ValidationSummary,
  spectraRoot: string
): string {
  const lines: string[] = [];

  // Group by schema path
  const bySchema = new Map<string, ValidationResult[]>();
  for (const result of summary.results) {
    const existing = bySchema.get(result.schemaPath) || [];
    existing.push(result);
    bySchema.set(result.schemaPath, existing);
  }

  for (const [schemaPath, schemaResults] of bySchema) {
    const relSchemaPath = path.relative(spectraRoot, schemaPath);
    lines.push(`Checking schema from: ${relSchemaPath}`);

    for (const result of schemaResults) {
      const relPath = path.relative(spectraRoot, result.path);
      const status = result.exists ? '✓' : '✗';
      const suffix = result.required ? '(required)' : '';
      const action = result.exists ? 'exists' : 'missing';
      lines.push(`  ${status} ${relPath} ${action} ${suffix}`);
    }

    lines.push('');
  }

  const totalChecks = summary.results.length;
  const status = summary.failed === 0 ? 'passed' : 'failed';
  lines.push(`Validation ${status}: ${totalChecks} checks, ${summary.failed} errors`);

  return lines.join('\n');
}
