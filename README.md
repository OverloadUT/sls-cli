# sls - Spectra Listing System

A semantic directory listing tool designed for AI agents operating within the Spectra hierarchy. Combines filesystem structure with human/AI-authored metadata from markdown front matter to enable one-shot directory understanding.

## Why sls?

Traditional directory exploration requires multiple steps:
1. Run `ls` or `tree` to see structure
2. Open README files to understand purpose
3. Read individual files for context
4. Iterate with high token cost

`sls` solves this by reading front matter from markdown files and presenting **structure AND meaning** in a single command.

## Installation

```bash
# Install dependencies
cd /path/to/sls
npm install

# Build the project
npm run build

# Link globally for command-line use
npm link

# Verify installation
sls --help
```

## Quick Start

```bash
# List current directory (JSON output)
sls

# List specific directory
sls /path/to/directory

# Human-readable tree format
sls /path/to/directory --human

# Limit depth
sls /path/to/directory --depth 2

# With height context (requires SPECTRA_WORKSPACE)
SPECTRA_WORKSPACE=/path/to/root sls /path/to/directory --human
```

## Usage Examples

### Example 1: Human-readable tree (default with --human)

```bash
$ SPECTRA_WORKSPACE=$PWD/fixtures/spectra sls fixtures/spectra/guilds/design-guild --human
```

Output:
```
╭─ Height ─────────────────────────────────────────────╮
│ guilds/design-guild                                  │
│                                                      │
│ guilds: Collection of AI agent guilds                │
╰──────────────────────────────────────────────────────╯

design-guild/  ← Visual design and branding guild
├── agents/  ← Design guild agent workspaces
│   └── ...
└── workspaces/  ← Code workspaces for design projects
    └── ...
```

### Example 2: JSON output (default)

```bash
$ sls fixtures/spectra
```

Output:
```json
{
  "entry": {
    "name": "spectra",
    "type": "directory",
    "description": "Spectra AI Network root",
    "modified": "2026-01-27T09:00:00.000Z",
    "children": [...]
  }
}
```

### Example 3: Error handling

```bash
$ sls /nonexistent/path
```

Output to stderr:
```json
{
  "success": false,
  "error": {
    "code": "PATH_NOT_FOUND",
    "message": "Path does not exist: /nonexistent/path",
    "suggestion": "Check that the path exists and try again"
  }
}
```

Exit code: 4

## CLI Reference

### Command

```
sls [path] [options]
```

### Arguments

- `path` - Directory or file to list (default: current directory)

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--human` | Output human-readable tree format | false (JSON) |
| `--json` | Force JSON output | true |
| `--depth <number>` | Override maximum traversal depth | 3 |
| `--validate` | Validate structure against schemas | false |
| `--audit` | Show metadata sources (local vs schema) | false |
| `--summary` | Include summary fields in output | false |
| `--no-height` | Omit height context box | false |
| `--show-ignored` | Show ignored files/directories | false |
| `--spec` | Output the full SLS specification | - |
| `--debug` | Enable debug output to stderr | false |
| `--help` | Show help message | - |
| `--version` | Show version number | - |

## Front Matter

See [SLS_SPEC.md](./SLS_SPEC.md) for the complete specification.

**Metadata fields:**
- `description` - One-line summary (max 1024 chars)
- `summary` - Extended explanation (optional)

**Directives (sls: prefix):**
- `sls:depth` - How deep to show contents when listed from above
- `sls:height` - How many ancestry levels to show when listing here
- `sls:ignore` - Exclude from listings
- `sls:schema` - Define required structure and defaults for children

## Schemas

Schemas define required structure and default metadata for child entries. They're defined in front matter and inherited by descendants.

```yaml
---
sls:schema:
  children:
    - name: agents
      type: directory
      required: true
      description: Guild member agent workspaces
      children:
        - pattern: "*"
          type: directory
          sls:height: 2
---
```

Schema defaults are used when entries don't have their own front matter, ensuring consistency across the hierarchy.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (invalid input, operation failed) |
| 3 | Permission denied |
| 4 | Not found (path doesn't exist) |

## Error Codes

All errors are output as structured JSON to stderr.

| Code | Description | Exit Code |
|------|-------------|-----------|
| `PATH_NOT_FOUND` | Path doesn't exist or is inaccessible | 4 |
| `INVALID_DEPTH` | Depth must be between 1 and 10 | 1 |
| `PARSE_ERROR` | Front matter parsing failed (gracefully degrades) | 1 |
| `PERMISSION_DENIED` | Cannot read directory/file | 3 |

## Development

### Build

```bash
npm run build
```

Compiles TypeScript to `dist/` directory.

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Debug Mode

Enable debug output to see warnings and additional information:

```bash
sls /path --debug
```

### Project Structure

```
sls/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── commands/
│   │   ├── list.ts           # Main command logic
│   │   └── types.ts          # Command types
│   ├── lib/
│   │   ├── frontmatter.ts    # YAML front matter parser
│   │   ├── traverse.ts       # Directory traversal
│   │   ├── schema.ts         # Schema resolution and validation
│   │   ├── height.ts         # Height/ancestry context
│   │   ├── ignore.ts         # .gitignore/.slsignore handling
│   │   ├── output.ts         # JSON/tree formatting
│   │   ├── errors.ts         # Error types and codes
│   │   └── validation.ts     # Input validation
│   └── types.ts              # Global types
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration tests
├── fixtures/                 # Test fixtures
└── dist/                     # Compiled output
```

## Safety & Constraints

- **Read-only**: Never writes files or makes destructive changes
- **Path validation**: Prevents directory traversal attacks
- **File size limits**: Skips files >5KB for front matter parsing
- **Depth limits**: Maximum depth of 10 (default 3)
- **Symlink safety**: Detects and handles symlink loops
- **Graceful degradation**: Continues on parse errors, logs to stderr

## Ignore Files

`sls` respects `.gitignore` and `.slsignore` files:

- `.slsignore` takes precedence over `.gitignore`
- Always ignores: `.git/`, `node_modules/`, `.DS_Store`
- Use `--show-ignored` to see ignored files

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SPECTRA_WORKSPACE` | Root of the Spectra hierarchy. Enables height context and full path resolution. |

## License

MIT

## Author

Spectra

---

**Version**: 0.1.0
**Node.js**: >=18.0.0
**Type**: ESM (module)
