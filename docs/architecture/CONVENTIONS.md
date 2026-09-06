# Architecture Doc Conventions

Rules every doc in `docs/architecture/` follows. Keep docs short.

For source code style, see [Code Conventions](#code-conventions) below.

## Frontmatter (4 fields, required)

```yaml
---
topic: <slug>
status: ready | stale
related: [<sibling-slug>, ...]
code: [<path>, <path>, ...]
---
```

- `status: stale` — anyone editing the underlying code flips to `stale`.
- `status: ready` — reviewer flips back after re-verifying.
- `code:` — primary paths to verify the doc. Plain paths only (use `path:line` in prose).

## Doc template

Every spoke `README.md` follows: TL;DR, Entry Points, Sequence (Mermaid), Key Components table, Data (sample JSON), Failure & State, See Also. **Skip any section that has nothing to say.**

## Diagrams

- Format: **Mermaid**, embedded in ` ```mermaid ` fences inside the README.
- Solid arrows for sync, dashed (`-.->`) for async/queued. This repo has no async layer today, so all arrows are solid.
- Renders natively on GitHub/Bitbucket and most editor previews.

## Examples / payloads

- Embed JSON in ` ```json ` fences inside the README.
- One topic = one file. No `examples/` or `diagrams/` subfolders — they don't render on GitHub/Bitbucket and break "one file = one full context."

## Code references

- In prose: `path/to/file.ext:123` (clickable in most editors).
- In frontmatter `code:`: plain paths only.

## File naming

- Topic folders: kebab-case (`screener/`, `config-and-runtime/`).
- `README.md` is the only doc per folder.

## This repo's feature-folder convention

- `features/<name>/` holds `components/`, `composables/`, `constants/`, `types/`, `utils/` for one feature. Today only `features/screener/` exists.
- `.eslintrc.cjs:1` enforces a hard boundary: a feature must not import from another feature's folder (`no-restricted-imports`, see [Testing & Quality](flows/cross-cutting/testing-and-quality/README.md)). Shared code goes in `common/` instead.
- When adding a second feature, add its name to `FEATURE_NAMES` in `.eslintrc.cjs:1` and give it its own spoke under `flows/` — don't fold it into the `screener` spoke.

## Code Conventions

Rules for application source code (everything outside `docs/`). Mechanically enforced by `.eslintrc.cjs:1` and run on every commit via `.husky/pre-commit` — a violation fails `pnpm lint` before it ever reaches review.

### Atomic files and components

- One file, one responsibility: a component renders one cohesive piece of UI, a composable owns one piece of reactive state/behavior, a util is a pure function group. If a file is doing two unrelated jobs, split it.
- Prefer composition over growth: when a component/composable picks up a second concern, extract the new concern into its own file and import it, rather than growing the original. See `features/screener/composables/useScreenerFilters.ts` (state) + `features/screener/utils/filterPredicates.ts` (pure predicates) for the pattern — reactive wiring and pure logic live in separate files.
- Components own their own styles (`<style scoped src="./Name.css">`) and don't depend on a parent's scoped CSS for their look. Small utility classes (e.g. `.link-button`) may be duplicated across a couple of component-scoped stylesheets rather than sharing one global rule across component boundaries — that duplication is intentional, not a DRY violation (see below).

### Size limits (enforced)

- **300 lines per file** (`max-lines`, blank lines and comments not counted). Split by extracting a component, composable, or util — don't just wrap code in a bigger file.
- **50 lines per function** (`max-lines-per-function`). If a function is doing filter-state setup *and* derived computations *and* clearing, split each concern into its own function.
- **Cyclomatic complexity ≤ 10** (`complexity`), **nesting ≤ 3 levels** (`max-depth`), **≤ 3 parameters per function** (`max-params` — bundle more into a single options object), **1 class per file** (`max-classes-per-file`).

### DRY

- No duplicated logic across files. If you copy-paste a function body, extract it to `utils/` (pure logic) or a composable (reactive state) and import it from both call sites instead — see `features/screener/utils/matchFor.ts`, shared by the sort composable and `ResultsTable.vue`.
- Duplicating a *value* (a small CSS rule, a literal) across component-scoped stylesheets is fine — it's not shared *logic*, and keeps each component self-contained (see above).

### Clean code / best practice

- Explicit return types on every exported function (`@typescript-eslint/explicit-function-return-type`, `explicit-module-boundary-types`) — no inferred-only public signatures.
- No `any` (`@typescript-eslint/no-explicit-any`). No reassigning parameters (`no-param-reassign`) — treat inputs as immutable.
- Default to no comments. Add one only when it explains a non-obvious *why* (a workaround, an invariant) — never to restate what the code already says.
- Don't add abstraction, config, or error handling for cases that can't happen. A 300-line cap is a signal to split along real seams, not to pad a file with premature indirection to dodge the linter.
