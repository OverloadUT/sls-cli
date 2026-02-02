# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`sls` (Semantic Directory Listing) is a CLI tool that combines filesystem structure with human/AI-authored metadata from markdown front matter. It outputs JSON or human-readable trees that include descriptions, purpose, and tags extracted from markdown files.

## Build & Development Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm link             # Link globally for CLI use (run 'sls' command)

npm test             # Run all tests
npm run test:unit    # Run unit tests only
npm run test:integration  # Run integration tests only

sls --help           # Verify installation, show CLI options
sls fixtures/example-workspace --debug  # Test with example data
```

Tests use Node.js built-in test runner (`node --test`) and are located in `tests/tests/` (note the double `tests/` path).

## Architecture

**Entry Flow:**
1. `src/index.ts` - CLI entry point using Commander.js
2. `src/commands/list.ts` - Main command orchestration: validates input, traverses directory, formats output
3. `src/lib/traverse.ts` - Recursive directory traversal that builds the entry tree

**Key Libraries:**
- `src/lib/frontmatter.ts` - Parses YAML front matter from markdown files using `gray-matter`
- `src/lib/ignore.ts` - Handles `.gitignore` and `.slsignore` filtering using `ignore` package
- `src/lib/output.ts` - Formats output as JSON or human-readable tree
- `src/lib/errors.ts` - Structured error output with `SLSError` class
- `src/lib/validation.ts` - Input validation for paths, depth, and glob patterns

**Type Definitions:**
- `src/types.ts` - Core types: `DirectoryEntry`, `FrontMatter`, `SuccessOutput`, `ErrorOutput`, `CLIOptions`, `ErrorCode`
- `src/commands/types.ts` - Command-specific option types

## Front Matter Support

The tool reads YAML front matter from markdown files for metadata:

**Standard fields:** `description`, `purpose`, `tags`

**Tool directives (sls: prefix):**
- `sls:depth` - Override traversal depth from this directory
- `sls:context` - Include context from parent/sibling files
- `sls:ignore` - Skip this file/directory

## Output Modes

- **JSON (default):** Structured output with `success`, `path`, `type`, `children`, etc.
- **Human (--human):** Tree format with descriptions

Errors output to stderr as structured JSON with `code`, `message`, `suggestion`, `context`.

## Exit Codes

- 0: Success
- 1: General error (invalid input, parse error)
- 3: Permission denied
- 4: Path not found
