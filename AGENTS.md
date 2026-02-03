# Repository Guidelines

See [CLAUDE.md](./CLAUDE.md) for complete project documentation including:

- Project overview
- Build and test commands
- Architecture and key files
- Front matter and schema system
- Output modes and exit codes

## Quick Reference

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm test             # Run all tests
sls --help           # Show CLI options
```

## Key Files

- `SLS_SPEC.md` - Full specification
- `src/index.ts` - CLI entry point
- `src/commands/list.ts` - Main command logic
- `src/lib/` - Core libraries (frontmatter, schema, height, traverse, output)
- `tests/unit/` and `tests/integration/` - Test suites
