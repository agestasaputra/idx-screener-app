# AGENTS.md

Guidance for AI coding agents (and new human contributors) working in this repo.

## What this app is

A single-feature Nuxt 4 app that screens Indonesia Stock Exchange (IDX) tickers against three chart-pattern heuristics using free Yahoo Finance data. See the [root README](README.md) for the product pitch, setup, and known limitations.

## Architecture Documentation

**Hub:** [docs/architecture/architecture.md](docs/architecture/architecture.md) — start here. The Topic Index links every flow to its own self-contained folder. Load only the spoke relevant to your task.

**Reference:**
- [docs/architecture/CONVENTIONS.md](docs/architecture/CONVENTIONS.md) — doc template, frontmatter spec, diagram rules.
- [docs/architecture/GLOSSARY.md](docs/architecture/GLOSSARY.md) — canonical terminology and external service names. Use the bolded form when writing.

### When you change code, decide: update the doc or not?

Before opening a PR, scan the `code:` frontmatter of every spoke under `docs/architecture/flows/`. If you touched a listed file, ask three questions in order:

1. **Did the flow change?** (sequence, contract, detector logic, new query param, new config key) → **update the spoke** and re-set `status: ready` after self-review.
2. **Did you add or rename something documented?** (new detector/criteria, new feature folder, new external service, new config key) → **extend an existing spoke or create a new one**. Add the term to `GLOSSARY.md` before using it.
3. **Was it cosmetic only?** (rename of an internal var, refactor with identical behavior, comment fix) → **no update needed**, leave `status` alone.

If you can't tell, flip the spoke's `status` to `stale` and call it out in the PR — let the reviewer decide.

### Adding a second feature

This repo currently has one feature (`features/screener/`). If you add a new `features/<name>/`:
1. Add `<name>` to `FEATURE_NAMES` in `.eslintrc.cjs` (enforces the cross-feature import boundary).
2. Give it its own spoke under `docs/architecture/flows/<name>/`, following the existing `screener` spoke as a template.
3. Don't fold it into the `screener` spoke, and don't put feature-specific code in `common/`.

### Update format (compact)

- Follow the doc template in `CONVENTIONS.md`. Skip any section that has nothing new to say — don't pad.
- Diagrams: Mermaid in ` ```mermaid ` fences inside the README. No separate `.mmd` files, no `diagrams/` subfolders.
- Examples: JSON in ` ```json ` fences inside the README. No separate `examples/` folder.
- Code references in prose use `path:line` format. Frontmatter `code:` lists plain paths.
- Use **canonical terms from `GLOSSARY.md`** — especially for external services (**Yahoo Finance**, **Stockbit**). If a term isn't in the glossary, add it there first.

### Don't

- Don't fork the docs — update the existing spoke instead of creating a parallel one.
- Don't introduce synonyms for a term already in the glossary.
- Don't add a doc that breaks the hub-and-spoke shape.
- Don't leave dangling references when removing code — grep across `docs/architecture/` and clean up.

## Quality gates (enforced by Husky pre-commit, see the Testing & Quality spoke)

```bash
pnpm lint         # eslint + prettier check
pnpm type-check   # vue-tsc --noEmit
pnpm test         # vitest
```

All three run automatically on `git commit` via `.husky/pre-commit`. Don't bypass with `--no-verify` unless the user explicitly asks.
