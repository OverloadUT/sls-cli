/**
 * Unit tests for front matter parsing
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { parseFrontMatter } from '../../dist/lib/frontmatter.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.join(__dirname, '../../fixtures/spectra');

test('parseFrontMatter extracts description', () => {
  const fixturePath = path.join(fixturesPath, 'README.md');
  const result = parseFrontMatter(fixturePath);

  assert.strictEqual(result.description, 'Spectra AI Network root');
});

test('parseFrontMatter extracts summary', () => {
  const fixturePath = path.join(fixturesPath, 'README.md');
  const result = parseFrontMatter(fixturePath);

  assert(result.summary);
  assert(result.summary.includes('root of the Spectra AI hierarchy'));
});

test('parseFrontMatter extracts sls:schema', () => {
  const fixturePath = path.join(fixturesPath, 'guilds/README.md');
  const result = parseFrontMatter(fixturePath);

  assert(result['sls:schema']);
  assert(result['sls:schema'].children);
  assert(result['sls:schema'].children.length > 0);
});

test('parseFrontMatter extracts nested schema children', () => {
  const fixturePath = path.join(fixturesPath, 'guilds/README.md');
  const result = parseFrontMatter(fixturePath);

  const schema = result['sls:schema'];
  assert(schema);

  // Find the pattern: "*" child
  const wildcardChild = schema.children.find(c => c.pattern === '*');
  assert(wildcardChild);
  assert(wildcardChild.children);

  // Find agents child within
  const agentsChild = wildcardChild.children.find(c => c.name === 'agents');
  assert(agentsChild);
  assert.strictEqual(agentsChild.required, true);
});

test('parseFrontMatter extracts sls:depth from schema', () => {
  const fixturePath = path.join(fixturesPath, 'guilds/README.md');
  const result = parseFrontMatter(fixturePath);

  const schema = result['sls:schema'];
  const wildcardChild = schema.children.find(c => c.pattern === '*');
  const agentsChild = wildcardChild.children.find(c => c.name === 'agents');
  const agentWildcard = agentsChild.children.find(c => c.pattern === '*');
  const memoriesChild = agentWildcard.children.find(c => c.name === 'memories');

  assert.strictEqual(memoriesChild['sls:depth'], 0);
});

test('parseFrontMatter extracts sls:height from schema', () => {
  const fixturePath = path.join(fixturesPath, 'guilds/README.md');
  const result = parseFrontMatter(fixturePath);

  const schema = result['sls:schema'];
  const wildcardChild = schema.children.find(c => c.pattern === '*');
  const agentsChild = wildcardChild.children.find(c => c.name === 'agents');
  const agentWildcard = agentsChild.children.find(c => c.pattern === '*');

  assert.strictEqual(agentWildcard['sls:height'], 2);
});

test('parseFrontMatter handles missing front matter gracefully', () => {
  const fixturePath = path.join(fixturesPath, 'guilds/design-guild/agents/alice/agent.md');
  const result = parseFrontMatter(fixturePath);

  // agent.md has no front matter
  assert.strictEqual(result.description, undefined);
});

test('parseFrontMatter handles non-existent file gracefully', () => {
  const result = parseFrontMatter('/nonexistent/file.md');
  assert.deepStrictEqual(result, {});
});
