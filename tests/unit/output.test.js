/**
 * Unit tests for output formatting
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { formatJSON, formatTree } from '../../dist/lib/output.js';

test('formatJSON produces valid JSON', () => {
  const entry = {
    name: 'test',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    description: 'Test directory',
    children: [],
  };

  const result = formatJSON(entry);
  const parsed = JSON.parse(result);

  assert(parsed.entry);
  assert.strictEqual(parsed.entry.name, 'test');
  assert.strictEqual(parsed.entry.description, 'Test directory');
});

test('formatJSON includes height context', () => {
  const entry = {
    name: 'test',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    children: [],
  };

  const height = {
    path: 'guilds/design-guild/test',
    ancestors: [
      { name: 'design-guild', description: 'Design guild' },
    ],
  };

  const result = formatJSON(entry, height);
  const parsed = JSON.parse(result);

  assert(parsed.height);
  assert.strictEqual(parsed.height.path, 'guilds/design-guild/test');
  assert.strictEqual(parsed.height.ancestors.length, 1);
});

test('formatJSON includes fileCount', () => {
  const entry = {
    name: 'memories',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    description: 'Memories folder',
    fileCount: 5,
  };

  const result = formatJSON(entry);
  const parsed = JSON.parse(result);

  assert.strictEqual(parsed.entry.fileCount, 5);
});

test('formatJSON includes children', () => {
  const entry = {
    name: 'test',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    children: [
      {
        name: 'file.md',
        type: 'file',
        modified: '2026-01-27T00:00:00Z',
        size: 100,
      },
    ],
  };

  const result = formatJSON(entry);
  const parsed = JSON.parse(result);

  assert(parsed.entry.children);
  assert.strictEqual(parsed.entry.children.length, 1);
  assert.strictEqual(parsed.entry.children[0].name, 'file.md');
});

test('formatTree produces readable output', () => {
  const entry = {
    name: 'test',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    description: 'Test directory',
    children: [],
  };

  const result = formatTree(entry);

  assert(result.includes('test/'));
  assert(result.includes('Test directory'));
});

test('formatTree includes height box', () => {
  const entry = {
    name: 'alice',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    description: 'Alice agent',
    children: [],
  };

  const height = {
    path: 'guilds/design-guild/agents/alice',
    ancestors: [
      { name: 'design-guild', description: 'Design guild' },
      { name: 'agents', description: 'Agents folder' },
    ],
  };

  const result = formatTree(entry, height);

  assert(result.includes('╭─ Height'));
  assert(result.includes('guilds/design-guild/agents/alice'));
  assert(result.includes('design-guild'));
});

test('formatTree shows file counts', () => {
  const entry = {
    name: 'alice',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    children: [
      {
        name: 'memories',
        type: 'directory',
        modified: '2026-01-27T00:00:00Z',
        description: 'Memories',
        fileCount: 3,
      },
    ],
  };

  const result = formatTree(entry);

  assert(result.includes('(3 items)'));
});

test('formatTree shows audit sources', () => {
  const entry = {
    name: 'alice',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    description: 'Alice agent',
    descriptionSource: { type: 'local' },
    children: [
      {
        name: 'agent.md',
        type: 'file',
        modified: '2026-01-27T00:00:00Z',
        description: 'Agent identity',
        descriptionSource: { type: 'schema', path: 'guilds/README.md' },
      },
    ],
  };

  const result = formatTree(entry, undefined, true);

  assert(result.includes('[local]'));
  assert(result.includes('[schema:'));
});

test('formatTree handles nested children', () => {
  const entry = {
    name: 'root',
    type: 'directory',
    modified: '2026-01-27T00:00:00Z',
    children: [
      {
        name: 'child1',
        type: 'directory',
        modified: '2026-01-27T00:00:00Z',
        children: [
          {
            name: 'grandchild.md',
            type: 'file',
            modified: '2026-01-27T00:00:00Z',
          },
        ],
      },
      {
        name: 'child2.md',
        type: 'file',
        modified: '2026-01-27T00:00:00Z',
      },
    ],
  };

  const result = formatTree(entry);

  assert(result.includes('root/'));
  assert(result.includes('child1/'));
  assert(result.includes('grandchild.md'));
  assert(result.includes('child2.md'));
});
