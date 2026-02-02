# SLS Specification

> The Spectra Listing System format specification.

SLS enables AI agents to understand filesystem structure and context in a single command. It combines directory listings with semantic metadata from Markdown front matter, providing comprehensive system prompt context management for AI agents operating within the Spectra hierarchy.

## Design principles

1. **One command, full context** - An agent should understand its workspace without multiple tool calls
2. **Self-describing hierarchy** - Every directory describes itself and its expected structure
3. **Token efficiency** - Output format is optimized for LLM comprehension
4. **Minimal drift** - Schemas defined at high levels prevent structural inconsistency
5. **Sensible defaults** - Schemas provide default metadata that can be overridden locally

## Environment

SLS operates within a Spectra workspace. The `SPECTRA_ROOT` environment variable defines the root of the hierarchy. This enables SLS to:

- Always know the full path context
- Orient agents within the hierarchy regardless of working directory
- Resolve ancestry for context display
- Apply schemas from ancestor directories

## Front matter format

SLS metadata is stored as YAML front matter in `README.md` files (for directories) or in Markdown files themselves, delimited by `---` lines:

```yaml
---
description: A one-line summary of this directory
summary: |
  A longer explanation when the description isn't enough.
  Can be multiple lines. Shown when more context is needed.
sls:depth: 2
sls:height: 1
sls:schema:
  children:
    - name: agents
      required: true
---
```

## Metadata fields

| Field         | Type   | Description                                       |
| ------------- | ------ | ------------------------------------------------- |
| `description` | string | Summary of what this is (max 1024 chars). Always shown in listings. |
| `summary`     | string | Extended explanation. Shown on request or in verbose mode. |

### `description` field

The primary metadata field. Answers "what is this?"

Good:
```yaml
description: AI agent workspace for design system development, with access to Figma MCP and design-tokens repository
```

Poor:
```yaml
description: Agent folder
```

### `summary` field

Optional. Use when the description isn't enough for an agent to understand context.

```yaml
summary: |
  This agent specializes in design system work including component APIs,
  token definitions, and documentation. It coordinates with the frontend
  guild on implementation details and maintains the design-tokens repo.
```

## Directives

Directives use the `sls:` prefix and control SLS behavior.

| Directive      | Type    | Description                                          |
| -------------- | ------- | ---------------------------------------------------- |
| `sls:depth`    | number  | How deep to show contents when listed from above     |
| `sls:height`   | number  | How many ancestry levels to show when listing here   |
| `sls:ignore`   | boolean | Exclude from listings                                |
| `sls:schema`   | object  | Define required structure and defaults for children  |

### `sls:depth`

Controls visibility when this directory appears in a parent listing.

```yaml
sls:depth: 0  # Just show me, don't list my children
sls:depth: 1  # Show my immediate children (default)
sls:depth: 3  # Show three levels deep
```

**Use cases:**
- `memories/` with hundreds of files → `sls:depth: 0` (just show the folder exists)
- `docs/` with important structure → `sls:depth: 4` (show full documentation tree)
- Agent workspace → `sls:depth: 2` (show structure but not deep contents)

### `sls:height`

Controls how much ancestry context is shown when listing FROM this directory.

```yaml
sls:height: 2  # Show 2 levels of parent context
```

When an agent runs `sls` from a directory with `sls:height: 2`, the output includes:
- The path from SPECTRA_ROOT to current location
- Descriptions of the 2 immediate parent directories

This orients the agent within the hierarchy without requiring additional commands.

### `sls:ignore`

Excludes the entry from listings.

```yaml
sls:ignore: true
```

### `sls:schema`

Defines required structure and default metadata for child directories. Schemas can define multiple levels deep from a single location.

#### Basic schema

```yaml
sls:schema:
  children:
    - name: agents
      type: directory
      required: true
```

#### Schema with defaults

Schemas can specify default values for `description`, `sls:depth`, and `sls:height`. These defaults apply to matching children unless overridden by the child's own front matter.

```yaml
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
          children:
            - name: agent.md
              required: true
              description: Agent identity, personality, and core directives
            - name: tools.md
              required: true
              description: Available tools and usage patterns
            - name: memories
              type: directory
              description: Persistent memories across sessions
              sls:depth: 0
            - name: ideas
              type: directory
              description: Ideas and concepts being developed
              sls:depth: 1
```

This schema, defined at the guilds level, specifies:
- Every guild must have an `agents/` directory
- Every agent workspace defaults to `sls:height: 2` (always shows guild context)
- Standard files have default descriptions (no front matter needed in individual files)
- `memories/` defaults to `sls:depth: 0` (folder shown, contents hidden unless explicitly listed)
- `ideas/` defaults to `sls:depth: 1` (shows idea files with descriptions)

#### Why schema defaults matter

1. **Consistency** - All `agent.md` files display the same description unless deliberately overridden
2. **Safety** - Agents don't need to write front matter for standard files, reducing clobber risk
3. **Maintainability** - Change a description once at the schema level, applies everywhere
4. **Context control** - Default `sls:height` ensures agents always know their guild context

#### Schema fields

| Field         | Type     | Description                                    |
| ------------- | -------- | ---------------------------------------------- |
| `name`        | string   | Exact name match                               |
| `pattern`     | string   | Glob pattern (e.g., `*` for any)               |
| `type`        | string   | `file` or `directory`                          |
| `required`    | boolean  | Whether this child must exist                  |
| `description` | string   | Default description for matching entries       |
| `sls:depth`   | number   | Default depth for matching entries             |
| `sls:height`  | number   | Default height for matching entries            |
| `children`    | array    | Nested child requirements and defaults         |

#### Resolution order

When determining metadata for an entry:

1. **Local front matter** takes precedence (if present)
2. **Schema defaults** are used if no local value exists
3. **Built-in defaults** apply if neither exists (`sls:depth: 1`, `sls:height: 0`)

#### Schema inheritance

Schemas are additive. A child directory can add requirements but cannot remove requirements defined by ancestors.

```
guilds/
├── README.md         ← schema: guilds must have agents/
└── design-guild/
    └── README.md     ← schema: this guild also requires workspaces/
```

The design-guild must have both `agents/` (from parent schema) and `workspaces/` (from its own schema).

## Output format

SLS output is optimized for LLM consumption. The primary format is a tree with descriptions.

### Tree output

```
╭─ Height ──────────────────────────────────────────────╮
│ guilds/design-guild/agents/alice                      │
│                                                       │
│ design-guild: Visual design and branding guild        │
│ agents: Guild member agent workspaces                 │
╰───────────────────────────────────────────────────────╯

alice/
│ AI agent for design system development
│
├── agent.md
│   Agent identity, personality, and core directives
├── tools.md
│   Available tools and usage patterns
├── memories/
│   Persistent memories across sessions
└── ideas/
    Ideas and concepts being developed
```

Note: The descriptions for `agent.md`, `tools.md`, `memories/`, and `ideas/` come from schema defaults—no front matter exists in these files.

### JSON output

For programmatic use:

```json
{
  "height": {
    "path": "guilds/design-guild/agents/alice",
    "ancestors": [
      {"name": "design-guild", "description": "Visual design and branding guild"},
      {"name": "agents", "description": "Guild member agent workspaces"}
    ]
  },
  "entry": {
    "name": "alice",
    "type": "directory",
    "description": "AI agent for design system development",
    "children": [...]
  }
}
```

## Validation

Schema validation compares actual structure against defined requirements.

```
$ sls --validate

Validating against schema defined in: guilds/README.md

✓ design-guild/agents exists
✓ design-guild/agents/alice/agent.md exists
✓ design-guild/agents/alice/tools.md exists
✗ design-guild/agents/bob/agent.md missing

1 validation error
```

## Audit mode

Audit mode shows where metadata values originate—useful for understanding what's using defaults versus explicit overrides.

```
$ sls --audit

alice/
│ AI agent for design system development [local]
│
├── agent.md
│   Agent identity, personality, and core directives [schema: guilds/README.md]
├── tools.md
│   Custom tool configuration for this agent [local override]
├── memories/
│   Persistent memories across sessions [schema: guilds/README.md]
│   depth: 0 [schema: guilds/README.md]
└── ideas/
    Ideas and concepts being developed [schema: guilds/README.md]
```

This helps identify:
- Which entries have local customizations
- Which are using schema defaults
- Where schemas are defined

## Ignore rules

Entries are excluded from listings in this order:

1. `sls:ignore: true` in front matter
2. Patterns in `.slsignore`
3. Patterns in `.gitignore`

### Built-in ignores

Always ignored:
- `.git/`
- `node_modules/`
- `.DS_Store`

## File metadata

For individual Markdown files (not directories), front matter in the file itself provides metadata:

```yaml
---
description: Memory of user's communication preferences
---
```

Non-Markdown files cannot carry SLS metadata directly but can receive default descriptions from schemas.

## Use in agent sessions

SLS is designed to run at agent session initialization via hooks. The output goes directly into the agent's system prompt, providing immediate workspace context.

Typical hook configuration:
```
on_session_start: sls $AGENT_WORKSPACE
```

The agent receives:
- Its position in the Spectra hierarchy (via height)
- Understanding of its workspace structure (via depth)
- Consistent descriptions from schema defaults
- Any local customizations

This eliminates exploratory commands at session start and ensures every agent session begins with full context awareness.

## Summary

| Concept | Purpose |
| ------- | ------- |
| `description` | What is this? (max 1024 chars, always shown) |
| `summary` | Extended context (shown on request) |
| `sls:depth` | How much of my contents to show when I'm listed |
| `sls:height` | How much ancestry to show when listing from here |
| `sls:ignore` | Hide from listings |
| `sls:schema` | Define required structure AND default metadata for children |
| Schema defaults | Descriptions, depth, height inherited from schema unless overridden |
| Height box | Orient agent within hierarchy |
| Audit mode | Show where metadata values originate |
| SPECTRA_ROOT | Anchor for full path resolution |
