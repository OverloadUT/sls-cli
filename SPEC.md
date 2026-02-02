# SPEC - sls CLI Source of Truth (Draft)

This document defines the intended, normative behavior for the `sls` CLI. It is based on the current implementation and documentation, with any uncertain or risky areas explicitly flagged as questionable.

## 1) Scope
`sls` is a read-only CLI that produces a semantic directory listing by combining filesystem structure with YAML front matter from Markdown files.

## 2) Supported Environments
- Node.js >= 18 (ESM)
- TypeScript source compiled to `dist/`

## 3) CLI Contract
### Command
`sls [path] [options]`

### Arguments
- `path` (optional): file or directory to list. Default is `.`

### Options
- `--human`: render human-readable tree output instead of JSON.
- `--depth <number>`: max depth (integer 1-10). Default `3`.
- `--no-descriptions`: omit front matter fields from output. [QUESTIONABLE: implementation appears to read `noDescriptions` but Commander sets `descriptions`]
- `--filter <pattern>`: glob pattern applied within each directory.
- `--show-ignored`: include entries matched by ignore rules.
- `--debug`: emit warnings to stderr.

### Exit Codes
- `0`: success
- `1`: general error
- `2`: invalid usage
- `3`: permission denied or safety check failed
- `4`: not found (path doesn’t exist)

[QUESTIONABLE: implementation currently maps most errors to exit 1 except `INVALID_PATH` which maps to 4; `PERMISSION_DENIED` is not emitted in code paths]

## 4) Output Formats
### JSON (default)
A JSON object with shape:
```
{
  success: true,
  path: string,
  type: 'directory' | 'file',
  description?: string,
  purpose?: string,
  tags?: string[],
  modified: string, // ISO 8601
  size?: number,
  children?: DirectoryEntry[]
}
```

### Human Tree
- Root entry prints first, followed by a description/purpose/tags block.
- Each child prints as `├─`/`└─` with description on the next line.

[QUESTIONABLE: formatting for nested children is uneven; indentation may be misleading in deeper trees]

## 5) Front Matter Rules
Front matter is YAML between `---` delimiters at the top of Markdown files. Only the following fields are consumed:
- `description` (string)
- `purpose` (string)
- `tags` (array of strings)
- `sls:depth` (number)
- `sls:context` (string)
- `sls:ignore` (boolean)

Parsing limits:
- Only the first 5KB is read
- Files > 1MB are skipped

[QUESTIONABLE: `sls:context` is parsed but not used in current traversal/output]
[QUESTIONABLE: `sls:depth` overrides CLI depth but is not re-validated to 1-10]

## 6) Traversal Semantics
- If `path` is a file, `sls` returns a single file entry.
- If `path` is a directory, `sls` returns a directory entry with children.
- Traversal depth defaults to 3 unless overridden by `--depth` or `sls:depth`.
- Children are sorted: directories first, then files; each group is alphabetical.

[QUESTIONABLE: `sls:ignore` is only checked on Markdown files; directories do not honor `sls:ignore` in README]
[QUESTIONABLE: depth checks are enforced before traversal, but a README can raise depth beyond CLI bounds]

### Symlink Loop Handling
- Inodes are tracked to detect symlink loops.
- On loop detection, a minimal directory entry is returned with description `(symlink loop detected)`.

[QUESTIONABLE: inode tracking uses `statSync`, which follows symlinks; behavior across filesystems may differ]

## 7) Ignore Rules
- Always ignore: `.git`, `node_modules`, `.DS_Store`, `*.swp`, `*.swo`.
- `.slsignore` is loaded if present; `.gitignore` is also loaded.

[QUESTIONABLE: `.slsignore` is intended to take precedence, but current code loads both regardless of order, effectively merging]
[QUESTIONABLE: ignore rules are evaluated per directory, not inherited like Git]

## 8) Filtering
- If `--filter` is set, it is run per-directory using `globby` with `cwd` set to that directory.
- Only items whose basename matches the filter set are kept.

[QUESTIONABLE: basename-only filtering can include unintended items when multiple directories contain the same name]

## 9) Validation and Errors
- Paths are resolved to absolute paths and must exist.
- Depth must be an integer from 1 to 10.
- Empty filter strings are rejected.
- Errors are emitted to stderr as structured JSON.

[QUESTIONABLE: path traversal protection checks `resolvedPath.includes('..')`, which is ineffective after `path.resolve`]
[QUESTIONABLE: unexpected errors are reported as `INVALID_PATH`]

## 10) Tests (Expected Behavior)
- Unit tests target `src/lib/*` and format output.
- Integration tests run the CLI via `dist/index.js`.

[QUESTIONABLE: `npm test` does not currently execute the TypeScript tests due to JS globbing]
[QUESTIONABLE: integration tests require a build step but do not enforce it]

## 11) Non-Goals / Safety Boundaries
- The CLI must not write to user files or modify directories.
- Large files are not fully read for metadata.
- Traversal is bounded by depth and ignore rules.

[QUESTIONABLE: depth can be overridden beyond limits via front matter]
