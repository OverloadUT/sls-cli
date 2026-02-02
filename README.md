# sls - Semantic Directory Listing CLI

A semantic directory listing tool designed for AI agents. Combines filesystem structure with human/AI-authored metadata from markdown front matter to enable one-shot directory understanding.

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

# Filter by pattern
sls /path/to/directory --filter "*.md"
```

## Usage Examples

### Example 1: JSON output (default)

```bash
$ sls fixtures/example-workspace
```

Output:
```json
{
  "success": true,
  "path": "example-workspace",
  "type": "directory",
  "description": "Example workspace for testing sls CLI",
  "tags": ["test", "example"],
  "modified": "2026-01-27T09:00:00Z",
  "children": [
    {
      "path": "docs",
      "type": "directory",
      "description": "Documentation directory",
      "tags": ["docs"],
      "modified": "2026-01-27T09:00:00Z",
      "children": [...]
    },
    {
      "path": "idea.md",
      "type": "file",
      "description": "A sample idea document",
      "tags": ["idea", "test"],
      "modified": "2026-01-27T09:00:00Z",
      "size": 128
    }
  ]
}
```

### Example 2: Human-readable tree

```bash
$ sls fixtures/example-workspace --human
```

Output:
```
example-workspace/
│ Example workspace for testing sls CLI
│
├─ docs/
│  └─ Documentation directory
│     ├─ guide.md
│     │  └─ User guide
└─ idea.md
   └─ A sample idea document
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
    "code": "INVALID_PATH",
    "message": "Path does not exist: /nonexistent/path",
    "suggestion": "Check the path and try again",
    "context": {
      "inputPath": "/nonexistent/path",
      "resolvedPath": "/nonexistent/path"
    }
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
| `--depth <number>` | Maximum depth to traverse | 3 |
| `--no-descriptions` | Show structure only, skip metadata | false |
| `--filter <pattern>` | Glob pattern to filter results | none |
| `--show-ignored` | Show ignored files/directories | false |
| `--debug` | Enable debug output to stderr | false |
| `--help` | Show help message | - |
| `--version` | Show version number | - |

### Front Matter Spec

See [FRONTMATTER.md](./FRONTMATTER.md) for the complete front matter specification.

**Standard fields (no prefix):**
- `description` - One-line summary
- `purpose` - Why this exists  
- `tags` - Array of tags

**Tool directives (sls: prefix):**
- `sls:depth` - Always list N levels deep from this directory
- `sls:context` - Include parent/sibling context file
- `sls:ignore` - Skip this directory/file

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error (invalid input, operation failed) |
| 2 | Invalid usage (missing arguments, unknown command) |
| 3 | Permission denied or safety check failed |
| 4 | Not found (path doesn't exist) |

## Error Codes

All errors are output as structured JSON to stderr.

| Code | Description | Exit Code |
|------|-------------|-----------|
| `INVALID_PATH` | Path doesn't exist or is inaccessible | 4 |
| `INVALID_DEPTH` | Depth must be between 1 and 10 | 1 |
| `PARSE_ERROR` | Front matter parsing failed (gracefully degrades) | 1 |
| `PERMISSION_DENIED` | Cannot read directory/file | 3 |
| `INVALID_FILTER` | Glob pattern syntax error | 1 |

## JSON Output Schema

```typescript
{
  success: true,
  path: string,              // Entry path
  type: 'directory' | 'file',
  description?: string,      // From front matter
  purpose?: string,          // From front matter
  tags?: string[],           // From front matter
  modified: string,          // ISO 8601 timestamp
  size?: number,             // Bytes (files only)
  children?: DirectoryEntry[] // Directories only
}
```

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
│   │   ├── ignore.ts         # .gitignore/.slsignore handling
│   │   ├── output.ts         # JSON/tree formatting
│   │   ├── errors.ts         # Error types and codes
│   │   └── validation.ts     # Input validation
│   └── types.ts              # Global types
├── tests/
│   ├── unit/                 # Unit tests
│   └── integration/          # Integration smoke tests
├── fixtures/                 # Test fixtures
└── dist/                     # Compiled output
```

## Safety & Constraints

- **Read-only**: Never writes files or makes destructive changes
- **Path validation**: Prevents directory traversal attacks
- **File size limits**: Skips files >1MB for front matter parsing
- **Depth limits**: Maximum depth of 10 (default 3) prevents infinite recursion
- **Symlink safety**: Detects and handles symlink loops
- **Graceful degradation**: Continues on parse errors, logs to stderr

## Ignore Files

`sls` respects `.gitignore` and `.slsignore` files:

- `.slsignore` takes precedence over `.gitignore`
- Always ignores: `.git/`, `node_modules/`, `.DS_Store`
- Use `--show-ignored` to see ignored files

## Use Cases

### AI Agents
- Explore unfamiliar codebases in one command
- Understand directory purpose without reading multiple files
- Efficient token usage (structure + metadata in single response)

### Human Developers
- Quick overview of project structure
- Discover documentation and purpose of directories
- Navigate large repositories efficiently

### Documentation
- Generate directory maps for documentation
- Validate front matter consistency
- Audit project organization

## License

MIT

## Author

Spectra

---

**Version**: 0.1.0  
**Node.js**: >=18.0.0  
**Type**: ESM (module)
