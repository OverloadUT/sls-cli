/**
 * Unit tests for output formatting
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { formatJSON, formatTree } from '../../src/lib/output.js';
test('formatJSON produces valid JSON', () => {
    const entry = {
        path: 'test',
        type: 'directory',
        modified: '2026-01-27T00:00:00Z',
        description: 'Test directory',
        children: [],
    };
    const result = formatJSON(entry);
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.success, true);
    assert.strictEqual(parsed.path, 'test');
    assert.strictEqual(parsed.description, 'Test directory');
});
test('formatJSON includes children', () => {
    const entry = {
        path: 'test',
        type: 'directory',
        modified: '2026-01-27T00:00:00Z',
        children: [
            {
                path: 'file.md',
                type: 'file',
                modified: '2026-01-27T00:00:00Z',
                size: 100,
            },
        ],
    };
    const result = formatJSON(entry);
    const parsed = JSON.parse(result);
    assert.strictEqual(parsed.children.length, 1);
    assert.strictEqual(parsed.children[0].path, 'file.md');
});
test('formatTree produces readable output', () => {
    const entry = {
        path: 'test',
        type: 'directory',
        modified: '2026-01-27T00:00:00Z',
        description: 'Test directory',
        children: [],
    };
    const result = formatTree(entry);
    assert(result.includes('test/'));
    assert(result.includes('Test directory'));
});
