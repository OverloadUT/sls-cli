/**
 * Unit tests for directory traversal
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { traverseDirectory } from '../../dist/lib/traverse.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.join(__dirname, '../../fixtures/spectra');

test('traverseDirectory returns directory entry', async () => {
  const result = await traverseDirectory(fixturesPath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  assert.strictEqual(result.type, 'directory');
  assert(result.children);
});

test('traverseDirectory includes name not path', async () => {
  const result = await traverseDirectory(fixturesPath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  assert.strictEqual(result.name, 'spectra');
});

test('traverseDirectory includes description from README', async () => {
  const result = await traverseDirectory(fixturesPath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  assert.strictEqual(result.description, 'Spectra AI Network root');
});

test('traverseDirectory applies schema default descriptions', async () => {
  const alicePath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const result = await traverseDirectory(alicePath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  // agent.md has no local front matter but should get schema default
  const agentMd = result.children.find(c => c.name === 'agent.md');
  assert(agentMd);
  assert.strictEqual(agentMd.description, 'Agent identity, personality, and core directives');
});

test('traverseDirectory uses local description over schema default', async () => {
  const alicePath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const result = await traverseDirectory(alicePath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  // tools.md has local front matter
  const toolsMd = result.children.find(c => c.name === 'tools.md');
  assert(toolsMd);
  assert.strictEqual(toolsMd.description, 'Custom tool configuration with Figma MCP access');
});

test('traverseDirectory shows fileCount for depth-0 directories', async () => {
  const alicePath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const result = await traverseDirectory(alicePath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  // memories has sls:depth: 0 from schema
  const memories = result.children.find(c => c.name === 'memories');
  assert(memories);
  assert.strictEqual(memories.fileCount, 3);
  assert.strictEqual(memories.children, undefined);
});

test('traverseDirectory expands depth-0 directory when queried directly', async () => {
  const memoriesPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice/memories');
  const result = await traverseDirectory(memoriesPath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  // When queried directly, should show children
  assert(result.children);
  assert(result.children.length > 0);
});

test('traverseDirectory respects CLI depth option', async () => {
  const result = await traverseDirectory(fixturesPath, {
    cliOptions: { depth: 1 },
    spectraRoot: fixturesPath,
  });

  // Should have children (depth 1)
  assert(result.children);

  // Children should not have deep nesting
  const guilds = result.children.find(c => c.name === 'guilds');
  assert(guilds);
  assert.strictEqual(guilds.children, undefined);
});

test('traverseDirectory sorts children correctly', async () => {
  const result = await traverseDirectory(fixturesPath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

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

test('traverseDirectory excludes README.md from children', async () => {
  const result = await traverseDirectory(fixturesPath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
  });

  const readme = result.children.find(c => c.name === 'README.md');
  assert.strictEqual(readme, undefined);
});

test('traverseDirectory tracks audit sources', async () => {
  const alicePath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const result = await traverseDirectory(alicePath, {
    cliOptions: {},
    spectraRoot: fixturesPath,
    audit: true,
  });

  // alice has local description
  assert(result.descriptionSource);
  assert.strictEqual(result.descriptionSource.type, 'local');

  // agent.md has schema default
  const agentMd = result.children.find(c => c.name === 'agent.md');
  assert(agentMd.descriptionSource);
  assert.strictEqual(agentMd.descriptionSource.type, 'schema');
});
