# Architecture Doc Conventions

Rules every doc in `docs/architecture/` follows. Keep docs short.

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
