# Front Matter Spec v0.1

This document defines the front matter format used by `sls` to extract semantic metadata from markdown files.

## Overview

Front matter is YAML metadata placed at the beginning of a markdown file, delimited by `---`:

```markdown
---
description: "One-line summary"
tags: ["tag1", "tag2"]
---

# Your Content Here
```

`sls` reads front matter from:
- **Directory README.md files** - describes the directory
- **Individual `.md` files** - describes each file

## Standard Semantic Fields

These fields provide semantic information about files and directories. They use **no prefix**.

### `description` (string, optional)

A concise, one-line summary of what this file or directory contains.

**Best practices:**
- Keep it under 100 characters
- Write for AI and human readers
- Be specific and descriptive
- Avoid redundant words like "This is a..."

**Examples:**

```yaml
description: "Authentication and authorization logic"
```

```yaml
description: "Quick-capture markdown for evolving thoughts"
```

```yaml
description: "REST API endpoints for user management"
```

### `purpose` (string, optional)

Explains *why* this file or directory exists, what problem it solves, or what role it plays.

**Best practices:**
- Complement the description (don't repeat it)
- Focus on intent and rationale
- Explain the "why" not the "what"

**Examples:**

```yaml
purpose: "Centralize all database models to prevent circular dependencies"
```

```yaml
purpose: "Provide reusable UI components across the application"
```

### `tags` (array of strings, optional)

Categorize and index files/directories for filtering and searching.

**Best practices:**
- Use lowercase, hyphenated tags
- Be consistent across your workspace
- Include both general and specific tags
- Avoid redundant tags

**Examples:**

```yaml
tags: ["api", "rest", "authentication"]
```

```yaml
tags: ["research", "architecture", "active"]
```

```yaml
tags: ["utility", "string-manipulation"]
```

## Tool Directives

These fields provide instructions to `sls` itself. They use the `sls:` prefix.

### `sls:depth` (number, optional)

Override the default depth limit when listing this directory. Useful for deep directories that should always be fully explored.

**Range:** 1-10

**Example:**

```yaml
# In a directory's README.md
---
description: "Core source code"
sls:depth: 5
---
```

When `sls` encounters this directory, it will traverse up to 5 levels deep regardless of the `--depth` flag.

### `sls:context` (string, optional)

Include an additional context file when listing this directory. Useful for pulling in parent or sibling documentation.

**Example:**

```yaml
# In subdir/README.md
---
description: "User authentication module"
sls:context: "../ARCHITECTURE.md"
---
```

**Note:** Context file inclusion is **planned for future versions** and not yet implemented in v0.1.

### `sls:ignore` (boolean, optional)

Exclude this file or directory from `sls` listings. More specific than `.slsignore` patterns.

**Example:**

```yaml
# In generated/README.md
---
description: "Auto-generated files"
sls:ignore: true
---
```

This directory will be skipped even if it's not in `.slsignore`.

## Complete Examples

### Directory README

```markdown
---
description: "REST API implementation"
purpose: "Expose backend services to frontend and mobile apps"
tags: ["api", "rest", "backend"]
sls:depth: 4
---

# API

This directory contains all REST API endpoints, middleware, and utilities.
```

### Individual File

```markdown
---
description: "User authentication middleware"
purpose: "Verify JWT tokens and populate req.user"
tags: ["middleware", "auth", "security"]
---

# Authentication Middleware

Validates incoming requests...
```

### File Without Front Matter

If a file has no front matter, `sls` will list it with only filesystem metadata:

```json
{
  "path": "README.md",
  "type": "file",
  "modified": "2026-01-27T09:00:00Z",
  "size": 1234
}
```

**No errors, no warnings** - graceful degradation.

## Best Practices

### For AI Agents

- **Be explicit**: Assume the agent has no prior context
- **Use consistent vocabulary**: Stick to common terms across your workspace
- **Include tags**: Help agents filter and categorize
- **Add purpose when non-obvious**: If the directory name doesn't explain "why", add `purpose`

### For Human Developers

- **Keep it brief**: One-line descriptions are easier to scan
- **Update as you go**: Front matter should evolve with the code
- **Don't duplicate content**: Front matter is metadata, not documentation
- **Use directory READMEs strategically**: Describe the directory, not individual files

### For Documentation

- **Use front matter + body**: Front matter is the *summary*, body is the *detail*
- **Be consistent with tags**: Define a tag taxonomy and stick to it
- **Don't over-tag**: 2-4 tags is usually enough

## Validation

`sls` validates front matter on read:

- **Unknown fields** are ignored (forward compatibility)
- **Invalid types** are logged to stderr (with `--debug`) but don't cause errors
- **Malformed YAML** is caught and handled gracefully - file is listed without metadata

## Parsing Limits

For performance and safety:

- Only the **first 5KB** of each file is read for front matter
- Files **larger than 1MB** are skipped entirely
- Parsing errors are **logged but don't stop execution**

## Why YAML?

YAML front matter is:
- **Human-readable** and easy to author
- **Standard** (used by Jekyll, Hugo, Obsidian, etc.)
- **Well-supported** (mature parsing libraries)
- **Flexible** (supports strings, arrays, numbers, booleans)

Future versions may support TOML or JSON, but YAML is sufficient for v0.1.

## Migration Guide

If you're already using front matter in your markdown files (e.g., for a static site generator), `sls` will work with it immediately:

- **Jekyll/Hugo front matter**: Compatible out of the box
- **Obsidian properties**: Compatible out of the box
- **Custom schemas**: `sls` ignores unknown fields, so your existing metadata is safe

Simply ensure you have `description`, `purpose`, or `tags` fields if you want `sls` to extract them.

## Future Extensions

Possible additions in future versions:

- `sls:context` implementation (include external files)
- `author`, `created`, `updated` timestamps
- `visibility: public|private|internal` for access control
- Support for JSDoc/docstrings in code files (non-markdown)
- JSON or TOML front matter formats

---

**Version**: 0.1  
**Spec Status**: Stable  
**Last Updated**: 2026-01-27
