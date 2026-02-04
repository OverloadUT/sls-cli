# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sls` (Spectra Listing System) is a CLI tool designed for AI agents operating within the Spectra hierarchy. It combines filesystem structure with human/AI-authored metadata from markdown front matter, outputting JSON or human-readable trees that include descriptions and context.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm link             # Link globally for CLI use (run 'sls' command)

npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration  # Run integration tests only

sls --help           # Verify installation, show CLI options
SPECTRA_WORKSPACE=$PWD/fixtures/spectra sls fixtures/spectra --human  # Test with fixtures
```

Tests use Node.js built-in test runner (`node --test`) and are located in `tests/unit/` and `tests/integration/`.

## Architecture

**Entry Flow:**
1. `src/index.ts` - CLI entry point using Commander.js
2. `src/commands/list.ts` - Main command orchestration: validates input, traverses directory, formats output
3. `src/lib/traverse.ts` - Recursive directory traversal that builds the entry tree

**Key Libraries:**
- `src/lib/frontmatter.ts` - Parses YAML front matter from markdown files using `gray-matter`
- `src/lib/schema.ts` - Schema resolution, matching, and validation
- `src/lib/height.ts` - Height/ancestry context handling with SPECTRA_WORKSPACE
- `src/lib/ignore.ts` - Handles `.gitignore` and `.slsignore` filtering using `ignore` package
- `src/lib/output.ts` - Formats output as JSON or human-readable tree
- `src/lib/errors.ts` - Structured error output with `SLSError` class
- `src/lib/validation.ts` - Input validation for paths, depth, and glob patterns

**Type Definitions:**
- `src/types.ts` - Core types: `OutputEntry`, `FrontMatter`, `SuccessOutput`, `HeightContext`, `SchemaChild`, `AuditEntry`
- `src/commands/types.ts` - Command-specific option types

## Front Matter Support

The tool reads YAML front matter from markdown files for metadata:

**Metadata fields:** `description`, `summary`

**Directives (sls: prefix):**
- `sls:depth` - How deep to show contents when listed from above
- `sls:height` - How many ancestry levels to show when listing here
- `sls:ignore` - Exclude from listings
- `sls:schema` - Define required structure and defaults for children

## Schema System

Schemas define required structure and default metadata for children. Key features:
- Pattern matching with exact names or globs (`*`, `*.md`)
- Nested schemas for deep hierarchy definitions
- Default values for `description`, `sls:depth`, `sls:height`
- Resolution order: Local front matter → Schema defaults → Built-in defaults

## Output Modes

- **JSON (default):** Structured output with `entry`, `height` (optional)
- **Human (--human):** Tree format with descriptions inline using `←` arrows
- **Validate (--validate):** Check structure against schema requirements
- **Audit (--audit):** Show where metadata originates (local vs schema)

Errors output to stderr as structured JSON with `code`, `message`, `suggestion`.

## Exit Codes

- 0: Success
- 1: General error (invalid input, parse error)
- 3: Permission denied
- 4: Path not found
