/**
 * Unit tests for front matter parsing
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { parseFrontMatter } from '../../src/lib/frontmatter.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
test('parseFrontMatter extracts description', () => {
    const fixturePath = path.join(__dirname, '../../fixtures/example-workspace/idea.md');
    const result = parseFrontMatter(fixturePath);
    assert.strictEqual(result.description, 'A sample idea document');
});
test('parseFrontMatter extracts tags', () => {
    const fixturePath = path.join(__dirname, '../../fixtures/example-workspace/idea.md');
    const result = parseFrontMatter(fixturePath);
    assert.deepStrictEqual(result.tags, ['idea', 'test']);
});
test('parseFrontMatter handles missing front matter gracefully', () => {
    const fixturePath = path.join(__dirname, '../../fixtures/example-workspace/plain.md');
    const result = parseFrontMatter(fixturePath);
    assert.deepStrictEqual(result, {});
});
test('parseFrontMatter handles non-existent file gracefully', () => {
    const result = parseFrontMatter('/nonexistent/file.md');
    assert.deepStrictEqual(result, {});
});
