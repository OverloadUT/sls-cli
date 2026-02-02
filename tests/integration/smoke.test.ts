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

test('CLI shows help', async () => {
  try {
    const { stdout } = await execAsync(`node ${CLI_PATH} --help`);
    assert(stdout.includes('Usage:') || stdout.includes('sls'));
  } catch (error: any) {
    // Help might exit with code 0, check stdout
    if (error.stdout) {
      assert(error.stdout.includes('Usage:') || error.stdout.includes('sls'));
    } else {
      throw error;
    }
  }
});

test('CLI shows version', async () => {
  try {
    const { stdout } = await execAsync(`node ${CLI_PATH} --version`);
    assert(stdout.includes('0.1'));
  } catch (error: any) {
    if (error.stdout) {
      assert(error.stdout.includes('0.1'));
    } else {
      throw error;
    }
  }
});

test('CLI outputs valid JSON for example workspace', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const { stdout } = await execAsync(`node ${CLI_PATH} ${fixturePath}`);
  
  const parsed = JSON.parse(stdout);
  assert.strictEqual(parsed.success, true);
  assert.strictEqual(parsed.type, 'directory');
  assert(parsed.children);
});

test('CLI outputs human-readable tree', async () => {
  const fixturePath = path.join(__dirname, '../../fixtures/example-workspace');
  const { stdout } = await execAsync(`node ${CLI_PATH} ${fixturePath} --human`);
  
  assert(stdout.includes('example-workspace/'));
  assert(stdout.includes('├─') || stdout.includes('└─'));
});

test('CLI handles invalid path with structured error', async () => {
  try {
    await execAsync(`node ${CLI_PATH} /nonexistent/path`);
    assert.fail('Should have thrown an error');
  } catch (error: any) {
    assert(error.stderr);
    const errorOutput = JSON.parse(error.stderr);
    assert.strictEqual(errorOutput.success, false);
    assert(errorOutput.error.code);
    assert(errorOutput.error.message);
    assert(errorOutput.error.suggestion);
  }
});
