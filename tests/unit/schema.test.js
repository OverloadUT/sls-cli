/**
 * Unit tests for schema parsing and validation
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  matchSchemaChild,
  collectAncestorSchemas,
  resolveDefaults,
  validateStructure,
} from '../../dist/lib/schema.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.join(__dirname, '../../fixtures/spectra');

test('matchSchemaChild matches by exact name', () => {
  const children = [
    { name: 'agents', type: 'directory', required: true },
    { name: 'workspaces', type: 'directory' },
  ];

  const match = matchSchemaChild(children, 'agents', 'directory');
  assert(match);
  assert.strictEqual(match.name, 'agents');
  assert.strictEqual(match.required, true);
});

test('matchSchemaChild matches by pattern', () => {
  const children = [
    { pattern: '*', type: 'directory' },
  ];

  const match = matchSchemaChild(children, 'design-guild', 'directory');
  assert(match);
  assert.strictEqual(match.pattern, '*');
});

test('matchSchemaChild returns null for no match', () => {
  const children = [
    { name: 'agents', type: 'directory' },
  ];

  const match = matchSchemaChild(children, 'nonexistent', 'directory');
  assert.strictEqual(match, null);
});

test('matchSchemaChild respects type', () => {
  const children = [
    { name: 'agents', type: 'directory' },
  ];

  // Should not match when type differs
  const match = matchSchemaChild(children, 'agents', 'file');
  assert.strictEqual(match, null);
});

test('collectAncestorSchemas finds schemas from root to entry', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const schemas = collectAncestorSchemas(entryPath, fixturesPath);

  // Should find schemas at: spectra/README.md, guilds/README.md, design-guild/README.md
  assert(schemas.length >= 2);

  // First schema should be from root
  assert(schemas[0].path.includes('spectra'));
});

test('resolveDefaults gets description from schema', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice/agent.md');
  const defaults = resolveDefaults(entryPath, 'agent.md', 'file', fixturesPath);

  assert.strictEqual(defaults.description, 'Agent identity, personality, and core directives');
  assert(defaults.source);
  assert.strictEqual(defaults.source.description.type, 'schema');
});

test('resolveDefaults gets sls:depth from schema', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice/memories');
  const defaults = resolveDefaults(entryPath, 'memories', 'directory', fixturesPath);

  assert.strictEqual(defaults.depth, 0);
  assert(defaults.source);
  assert.strictEqual(defaults.source.depth.type, 'schema');
});

test('resolveDefaults gets sls:height from schema', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const defaults = resolveDefaults(entryPath, 'alice', 'directory', fixturesPath);

  assert.strictEqual(defaults.height, 2);
  assert(defaults.source);
  assert.strictEqual(defaults.source.height.type, 'schema');
});

test('validateStructure finds all schemas and validates', () => {
  const summary = validateStructure(fixturesPath, fixturesPath);

  // Should have found multiple checks
  assert(summary.results.length > 0);

  // All should pass for our valid fixtures
  assert.strictEqual(summary.failed, 0);
});

test('validateStructure checks required items', () => {
  const summary = validateStructure(fixturesPath, fixturesPath);

  // Should have checked for required items like agents/, agent.md, tools.md
  const agentsCheck = summary.results.find(r => r.path.includes('agents'));
  assert(agentsCheck);
});
