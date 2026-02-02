# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the TypeScript source. The CLI entry point is `src/index.ts`, with command logic in `src/commands/` and shared utilities in `src/lib/`.
- `tests/` holds TypeScript tests (`tests/unit/` and `tests/integration/`).
- `fixtures/` provides sample workspaces used by tests.
- `dist/` is compiled output from `tsc` and should not be edited by hand.
- `FRONTMATTER.md` documents the YAML front matter schema used by `sls`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run build` compiles TypeScript to `dist/`.
- `npm test` runs unit then integration tests.
- `npm run test:unit` runs fast unit tests.
- `npm run test:integration` runs CLI smoke tests against `dist/index.js` (build first if needed).

## Coding Style & Naming Conventions
- TypeScript, ESM modules, Node.js >= 18. Use `.js` extensions in ESM import paths within TS (see `src/index.ts`).
- Indentation is 2 spaces; keep lines short and readable.
- Prefer clear, descriptive function names and data-first helpers in `src/lib/`.
- No formatter or linter is configured; keep changes consistent with existing style.

## Testing Guidelines
- Tests use Node’s built-in test runner (`node:test`) and live in `tests/**/*.test.ts`.
- Name files with the `.test.ts` suffix and group by `unit` vs `integration`.
- Integration tests invoke the compiled CLI, so rebuild if you change command behavior.

## Commit & Pull Request Guidelines
- This repo has no Git commits yet, so no established commit message convention.
- When creating the first commits, use short, imperative messages (e.g., "Add ignore handling").
- PRs should include a brief summary, the commands run (e.g., `npm test`), and any behavior changes. Include sample CLI output if user-facing.

## Security & Configuration Notes
- The CLI is read-only by design; avoid introducing writes to user directories.
- `.slsignore` and `.gitignore` are honored; update tests/fixtures if ignore behavior changes.
