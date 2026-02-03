/**
 * Integration smoke tests
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.join(__dirname, '../../dist/index.js');
const FIXTURES_PATH = path.join(__dirname, '../../fixtures/spectra');

test('CLI shows help', async () => {
  try {
    const { stdout } = await execAsync(`node ${CLI_PATH} --help`);
    assert(stdout.includes('sls') || stdout.includes('Spectra'));
  } catch (error) {
    if (error.stdout) {
      assert(error.stdout.includes('sls') || error.stdout.includes('Spectra'));
    } else {
      throw error;
    }
  }
});

test('CLI shows version', async () => {
  try {
    const { stdout } = await execAsync(`node ${CLI_PATH} --version`);
    assert(stdout.includes('0.2'));
  } catch (error) {
    if (error.stdout) {
      assert(error.stdout.includes('0.2'));
    } else {
      throw error;
    }
  }
});

test('CLI outputs valid JSON', async () => {
  const { stdout } = await execAsync(`node ${CLI_PATH} ${FIXTURES_PATH} --json`);
  const parsed = JSON.parse(stdout);

  assert(parsed.entry);
  assert.strictEqual(parsed.entry.type, 'directory');
  assert(parsed.entry.children);
});

test('CLI outputs human-readable tree', async () => {
  const { stdout } = await execAsync(`node ${CLI_PATH} ${FIXTURES_PATH}`);

  assert(stdout.includes('spectra/'));
  assert(stdout.includes('├──') || stdout.includes('└──'));
});

test('CLI includes height context with SPECTRA_ROOT', async () => {
  const alicePath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${alicePath}`
  );

  assert(stdout.includes('╭─ Height'));
  assert(stdout.includes('design-guild'));
  assert(stdout.includes('agents'));
});

test('CLI applies schema defaults', async () => {
  const alicePath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${alicePath}`
  );

  // agent.md should have schema default description
  assert(stdout.includes('Agent identity, personality, and core directives'));
});

test('CLI shows file counts for depth-0 folders', async () => {
  const alicePath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${alicePath}`
  );

  // memories should show file count
  assert(stdout.includes('(3 items)'));
});

test('CLI expands depth-0 folder when listed directly', async () => {
  const memoriesPath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice/memories');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${memoriesPath}`
  );

  // Should show individual files
  assert(stdout.includes('2026-01-15-user-prefs.md'));
  assert(stdout.includes('2026-01-20-project.md'));
});

test('CLI validates structure successfully', async () => {
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${FIXTURES_PATH} --validate`
  );

  assert(stdout.includes('Validation passed'));
  assert(stdout.includes('0 errors'));
});

test('CLI shows audit information', async () => {
  const alicePath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${alicePath} --audit`
  );

  assert(stdout.includes('[local]'));
  assert(stdout.includes('[schema:'));
});

test('CLI handles invalid path with structured error', async () => {
  try {
    await execAsync(`node ${CLI_PATH} /nonexistent/path`);
    assert.fail('Should have thrown an error');
  } catch (error) {
    assert(error.stderr);
    const errorOutput = JSON.parse(error.stderr);
    assert.strictEqual(errorOutput.success, false);
    assert(errorOutput.error.code);
    assert(errorOutput.error.message);
    assert(errorOutput.error.suggestion);
  }
});

test('CLI respects --depth option', async () => {
  const { stdout } = await execAsync(
    `node ${CLI_PATH} ${FIXTURES_PATH} --depth 1`
  );

  // Should show guilds but not contents
  assert(stdout.includes('guilds/'));
  // Should NOT show nested guild contents
  assert(!stdout.includes('design-guild/'));
});

test('CLI JSON includes height context', async () => {
  const alicePath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${alicePath} --json`
  );

  const parsed = JSON.parse(stdout);
  assert(parsed.height);
  assert.strictEqual(parsed.height.path, 'guilds/design-guild/agents/alice');
  assert(parsed.height.ancestors.length === 2);
});

test('CLI respects --no-height option', async () => {
  const alicePath = path.join(FIXTURES_PATH, 'guilds/design-guild/agents/alice');
  const { stdout } = await execAsync(
    `SPECTRA_ROOT="${FIXTURES_PATH}" node ${CLI_PATH} ${alicePath} --no-height`
  );

  // Should NOT include height box
  assert(!stdout.includes('╭─ Height'));
});

test('CLI respects ignore rules', async () => {
  const { stdout } = await execAsync(`node ${CLI_PATH} ${FIXTURES_PATH}`);

  // ignored-folder should not appear
  assert(!stdout.includes('ignored-folder'));
});
