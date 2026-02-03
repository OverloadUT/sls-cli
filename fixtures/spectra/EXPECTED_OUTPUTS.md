# Expected SLS Outputs

This document defines the exact expected output for a spec-compliant SLS CLI when run against the `fixtures/spectra/` test hierarchy.

## Test Cases

### 1. Agent Workspace with Height Context

**Command:** `sls fixtures/spectra/guilds/design-guild/agents/alice`

This is the primary use case: an agent understanding its workspace at session start.

**Expected Output:**

```
╭─ Height ──────────────────────────────────────────────╮
│ guilds/design-guild/agents/alice                      │
│                                                       │
│ design-guild: Visual design and branding guild        │
│ agents: Design guild agent workspaces                 │
╰───────────────────────────────────────────────────────╯

alice/
│ AI agent for design system development
│
├── agent.md
│   Agent identity, personality, and core directives
├── ideas/
│   Ideas and concepts being developed (2 files)
├── memories/
│   Persistent memories across sessions (3 files)
└── tools.md
    Custom tool configuration with Figma MCP access
```

**Key behaviors demonstrated:**
- Height box shows 2 levels of ancestry (from schema default `sls:height: 2`)
- `agent.md` gets description from schema default (no local front matter)
- `tools.md` shows local override description
- `memories/` and `ideas/` show file counts (schema default `sls:depth: 0`)
- Entries sorted: directories first, then files, alphabetically

---

### 2. Expanded Memories Folder

**Command:** `sls fixtures/spectra/guilds/design-guild/agents/alice/memories`

When an agent needs to see all memories.

**Expected Output:**

```
╭─ Height ──────────────────────────────────────────────╮
│ guilds/design-guild/agents/alice/memories             │
│                                                       │
│ alice: AI agent for design system development         │
│ agents: Design guild agent workspaces                 │
╰───────────────────────────────────────────────────────╯

memories/
│ Alice's persistent memories
│
├── 2026-01-15-user-prefs.md
│   User's preferred communication style and tone
├── 2026-01-20-project.md
│   Current project context - design system v2
└── 2026-01-25-api-notes.md
    Notes on component API patterns
```

**Key behaviors:**
- When listing a directory directly, shows all children regardless of `sls:depth`
- Height context still applies (inherited from parent agent workspace)
- Local README description overrides schema default
- Files sorted alphabetically

---

### 3. Guild Level Listing

**Command:** `sls fixtures/spectra/guilds/design-guild`

Viewing a guild's structure.

**Expected Output:**

```
design-guild/
│ Visual design and branding guild
│
├── agents/
│   Design guild agent workspaces
│   ├── alice/
│   │   AI agent for design system development
│   │   ├── agent.md
│   │   │   Agent identity, personality, and core directives
│   │   ├── ideas/
│   │   │   Ideas and concepts being developed (2 files)
│   │   ├── memories/
│   │   │   Persistent memories across sessions (3 files)
│   │   └── tools.md
│   │       Custom tool configuration with Figma MCP access
│   └── bob/
│       AI agent for visual design and branding
│       ├── agent.md
│       │   Agent identity, personality, and core directives
│       ├── memories/
│       │   Persistent memories across sessions (0 files)
│       └── tools.md
│           Available tools and usage patterns
└── workspaces/
    Code workspaces for design projects
```

**Key behaviors:**
- No height box (no `sls:height` specified at this level)
- Shows nested structure with proper depth
- Bob's `tools.md` uses schema default (no local front matter)
- Bob's memories shows 0 files
- `workspaces/` is guild-specific, not from parent schema

---

### 4. Root Level Listing

**Command:** `sls fixtures/spectra`

Full Spectra hierarchy view.

**Expected Output:**

```
spectra/
│ Spectra AI Network root
│
└── guilds/
    Collection of AI agent guilds
    ├── design-guild/
    │   Visual design and branding guild
    │   ├── agents/
    │   │   Design guild agent workspaces
    │   │   ├── alice/
    │   │   │   AI agent for design system development
    │   │   │   ├── agent.md
    │   │   │   │   Agent identity, personality, and core directives
    │   │   │   ├── ideas/
    │   │   │   │   Ideas and concepts being developed (2 files)
    │   │   │   ├── memories/
    │   │   │   │   Persistent memories across sessions (3 files)
    │   │   │   └── tools.md
    │   │   │       Custom tool configuration with Figma MCP access
    │   │   └── bob/
    │   │       AI agent for visual design and branding
    │   │       ├── agent.md
    │   │       │   Agent identity, personality, and core directives
    │   │       ├── memories/
    │   │       │   Persistent memories across sessions (0 files)
    │   │       └── tools.md
    │   │           Available tools and usage patterns
    │   └── workspaces/
    │       Code workspaces for design projects
    └── research-guild/
        Research and knowledge synthesis guild
        ├── agents/
        │   Research guild agent workspaces
        │   └── charlie/
        │       AI agent for technical research and analysis
        │       ├── agent.md
        │       │   Agent identity, personality, and core directives
        │       ├── ideas/
        │       │   Ideas and concepts being developed (0 files)
        │       ├── memories/
        │       │   Persistent memories across sessions (1 file)
        │       └── tools.md
        │           Available tools and usage patterns
        └── references/
            Reference materials and research papers
```

**Key behaviors:**
- `ignored-folder/` does not appear (in `.slsignore`)
- Full recursive structure with all schema defaults applied
- File counts for depth-0 directories

---

### 5. Validation Mode

**Command:** `sls --validate fixtures/spectra`

Check structure against schemas.

**Expected Output:**

```
Validating fixtures/spectra...

Checking schema from: fixtures/spectra/README.md
  ✓ guilds/ exists (required)

Checking schema from: fixtures/spectra/guilds/README.md
  ✓ design-guild/agents/ exists (required)
  ✓ design-guild/agents/alice/agent.md exists (required)
  ✓ design-guild/agents/alice/tools.md exists (required)
  ✓ design-guild/agents/bob/agent.md exists (required)
  ✓ design-guild/agents/bob/tools.md exists (required)
  ✓ research-guild/agents/ exists (required)
  ✓ research-guild/agents/charlie/agent.md exists (required)
  ✓ research-guild/agents/charlie/tools.md exists (required)

Checking schema from: fixtures/spectra/guilds/design-guild/README.md
  ✓ workspaces/ exists (required)

Checking schema from: fixtures/spectra/guilds/research-guild/README.md
  ✓ references/ exists (required)

Validation passed: 11 checks, 0 errors
```

**Key behaviors:**
- Walks all schemas from root down
- Reports which schema file defines each requirement
- Shows required items that exist
- Would show ✗ for missing required items

---

### 6. Validation with Errors

**Setup:** Delete `fixtures/spectra/guilds/design-guild/agents/bob/agent.md`

**Command:** `sls --validate fixtures/spectra`

**Expected Output:**

```
Validating fixtures/spectra...

Checking schema from: fixtures/spectra/guilds/README.md
  ✓ design-guild/agents/ exists (required)
  ✓ design-guild/agents/alice/agent.md exists (required)
  ✓ design-guild/agents/alice/tools.md exists (required)
  ✗ design-guild/agents/bob/agent.md missing (required)
  ✓ design-guild/agents/bob/tools.md exists (required)
  ...

Validation failed: 11 checks, 1 error
```

Exit code: 1

---

### 7. Audit Mode

**Command:** `sls --audit fixtures/spectra/guilds/design-guild/agents/alice`

Show where metadata comes from.

**Expected Output:**

```
╭─ Height ──────────────────────────────────────────────╮
│ guilds/design-guild/agents/alice                      │
│                                                       │
│ design-guild: Visual design and branding guild        │
│ agents: Design guild agent workspaces                 │
╰───────────────────────────────────────────────────────╯

alice/
│ AI agent for design system development [local]
│ height: 2 [schema: guilds/README.md]
│
├── agent.md
│   Agent identity, personality, and core directives [schema: guilds/README.md]
├── ideas/
│   Ideas and concepts being developed (2 files) [schema: guilds/README.md]
│   depth: 0 [schema: guilds/README.md]
├── memories/
│   Persistent memories across sessions (3 files) [schema: guilds/README.md]
│   depth: 0 [schema: guilds/README.md]
└── tools.md
    Custom tool configuration with Figma MCP access [local]
```

**Key behaviors:**
- `[local]` indicates front matter in the file itself
- `[schema: path]` indicates value from schema defaults
- Shows both description and directive sources
- Helps debug "why does this have that value?"

---

### 8. JSON Output

**Command:** `sls --json fixtures/spectra/guilds/design-guild/agents/alice`

**Expected Output:**

```json
{
  "height": {
    "path": "guilds/design-guild/agents/alice",
    "ancestors": [
      {
        "name": "design-guild",
        "description": "Visual design and branding guild"
      },
      {
        "name": "agents",
        "description": "Design guild agent workspaces"
      }
    ]
  },
  "entry": {
    "name": "alice",
    "type": "directory",
    "description": "AI agent for design system development",
    "modified": "2026-01-27T12:00:00.000Z",
    "children": [
      {
        "name": "agent.md",
        "type": "file",
        "description": "Agent identity, personality, and core directives",
        "modified": "2026-01-27T12:00:00.000Z",
        "size": 185
      },
      {
        "name": "ideas",
        "type": "directory",
        "description": "Ideas and concepts being developed",
        "modified": "2026-01-27T12:00:00.000Z",
        "fileCount": 2
      },
      {
        "name": "memories",
        "type": "directory",
        "description": "Persistent memories across sessions",
        "modified": "2026-01-27T12:00:00.000Z",
        "fileCount": 3
      },
      {
        "name": "tools.md",
        "type": "file",
        "description": "Custom tool configuration with Figma MCP access",
        "modified": "2026-01-27T12:00:00.000Z",
        "size": 243
      }
    ]
  }
}
```

**Key behaviors:**
- `height` section with path and ancestors
- `fileCount` instead of `children` for depth-0 directories
- `modified` and `size` are actual values (will vary)
- Sorted consistently with tree output

---

### 9. Structure-Only Mode (Optional Future)

**Command:** `sls --structure fixtures/spectra`

If implemented, would show only directories without files.

---

## Summary of Test Coverage

| Feature | Test Case |
|---------|-----------|
| Height context box | 1, 2, 7 |
| Schema default descriptions | 1, 3 |
| Local description override | 1 (tools.md) |
| File count for depth: 0 | 1, 3, 4 |
| Expanded listing | 2 |
| Ignore rules | 4 (ignored-folder absent) |
| Schema validation | 5, 6 |
| Validation errors | 6 |
| Audit mode | 7 |
| JSON output | 8 |
| Nested schemas | 5 (multiple schema files) |
| Additive schemas | 3 (workspaces from guild schema) |
