#!/usr/bin/env node

/**
 * Bundle SLS_SPEC.md into a TypeScript module at build time.
 * This ensures the spec is embedded in the compiled output.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const specPath = join(rootDir, 'SLS_SPEC.md');
const outputPath = join(rootDir, 'src', 'lib', 'spec.ts');

const spec = readFileSync(specPath, 'utf-8');

// Escape backticks and backslashes for template literal
const escaped = spec
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const output = `// Auto-generated at build time - do not edit
// Source: SLS_SPEC.md

export const SLS_SPEC = \`${escaped}\`;
`;

writeFileSync(outputPath, output);
console.log('Bundled SLS_SPEC.md into src/lib/spec.ts');
