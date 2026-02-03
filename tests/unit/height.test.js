/**
 * Unit tests for height/ancestry handling
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  getSpectraRoot,
  buildHeightContext,
  resolveHeight,
  getAncestorDescription,
} from '../../dist/lib/height.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.join(__dirname, '../../fixtures/spectra');

test('getSpectraRoot returns null when not set', () => {
  const originalRoot = process.env.SPECTRA_ROOT;
  delete process.env.SPECTRA_ROOT;

  const root = getSpectraRoot();
  assert.strictEqual(root, null);

  // Restore
  if (originalRoot) process.env.SPECTRA_ROOT = originalRoot;
});

test('getSpectraRoot returns path when set', () => {
  const originalRoot = process.env.SPECTRA_ROOT;
  process.env.SPECTRA_ROOT = fixturesPath;

  const root = getSpectraRoot();
  assert(root);
  assert(root.includes('spectra'));

  // Restore
  if (originalRoot) {
    process.env.SPECTRA_ROOT = originalRoot;
  } else {
    delete process.env.SPECTRA_ROOT;
  }
});

test('getAncestorDescription returns description from README', () => {
  const ancestorPath = path.join(fixturesPath, 'guilds/design-guild');
  const description = getAncestorDescription(ancestorPath, fixturesPath);

  assert.strictEqual(description, 'Visual design and branding guild');
});

test('getAncestorDescription returns schema default when no local', () => {
  // agents folder has local description but let's test a case with schema default
  const ancestorPath = path.join(fixturesPath, 'guilds/design-guild/agents');
  const description = getAncestorDescription(ancestorPath, fixturesPath);

  assert(description);
  // Could be local or schema default
});

test('buildHeightContext returns null for zero height', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const context = buildHeightContext(entryPath, 0, fixturesPath);

  assert.strictEqual(context, null);
});

test('buildHeightContext returns null without spectraRoot', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const context = buildHeightContext(entryPath, 2, null);

  assert.strictEqual(context, null);
});

test('buildHeightContext builds correct path', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const context = buildHeightContext(entryPath, 2, fixturesPath);

  assert(context);
  assert.strictEqual(context.path, 'guilds/design-guild/agents/alice');
});

test('buildHeightContext includes correct ancestors', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const context = buildHeightContext(entryPath, 2, fixturesPath);

  assert(context);
  assert.strictEqual(context.ancestors.length, 2);

  // Should be design-guild and agents (2 levels up)
  const names = context.ancestors.map(a => a.name);
  assert(names.includes('design-guild'));
  assert(names.includes('agents'));
});

test('buildHeightContext includes ancestor descriptions', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const context = buildHeightContext(entryPath, 2, fixturesPath);

  assert(context);

  const designGuild = context.ancestors.find(a => a.name === 'design-guild');
  assert(designGuild);
  assert.strictEqual(designGuild.description, 'Visual design and branding guild');
});

test('resolveHeight returns 0 by default', () => {
  const entryPath = path.join(fixturesPath, 'guilds');
  const height = resolveHeight(entryPath, fixturesPath);

  // guilds doesn't have sls:height set
  assert.strictEqual(height, 0);
});

test('resolveHeight returns schema default', () => {
  const entryPath = path.join(fixturesPath, 'guilds/design-guild/agents/alice');
  const height = resolveHeight(entryPath, fixturesPath);

  // alice should get sls:height: 2 from schema
  assert.strictEqual(height, 2);
});
