/**
 * Unit tests for directory traversal
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { traverseDirectory } from '../../src/lib/traverse.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('traverseDirectory returns directory entry', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const result = await traverseDirectory(fixturePath, {});

  assert.strictEqual(result.type, 'directory');
  assert(result.children);
});

test('traverseDirectory includes description from README', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const result = await traverseDirectory(fixturePath, {});

  assert.strictEqual(result.description, 'Example workspace for testing sls CLI');
});

test('traverseDirectory respects depth limit', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const result = await traverseDirectory(fixturePath, { depth: 1 });

  // Should have children (depth 1)
  assert(result.children);
  assert(result.children.length > 0);

  // Children should not have deep nesting
  const docsDir = result.children.find((c) => c.path === 'docs');
  if (docsDir && docsDir.children) {
    // At depth 1, docs should have no children loaded
    assert.strictEqual(docsDir.children.length, 0);
  }
});

test('traverseDirectory handles noDescriptions option', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const result = await traverseDirectory(fixturePath, { noDescriptions: true });

  assert.strictEqual(result.description, undefined);
});

test('traverseDirectory sorts children correctly', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const result = await traverseDirectory(fixturePath, {});

  if (result.children && result.children.length > 1) {
    // Directories should come before files
    let foundFile = false;
    for (const child of result.children) {
      if (child.type === 'file') {
        foundFile = true;
      } else if (child.type === 'directory' && foundFile) {
        assert.fail('Directory found after file - sort order is wrong');
      }
    }
  }
});
