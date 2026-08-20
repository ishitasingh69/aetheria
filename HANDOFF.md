# HANDOFF — aetheria

## Verified working (this session, 2026-08-20)
- `yarn compile` — contract compiles clean (2 circuits: placeOrder, proveSolvency).
- `npx tsc --noEmit` (repo root) — clean.
- `web/` installed (`yarn web:install`), `svelte-check` — 0 errors, 0 warnings.
- `yarn web:build` — full SvelteKit static build succeeds, writes `web/build`.
- Fixed 3 real bugs found this session (all committed):
  1. `web/src/lib/components/SolvencyRail.svelte` — local `let state = $derived(...)`
     shadowed the Svelte 5 `$state` rune on the *earlier* line, making the compiler
     misparse `$state(false)` as a store auto-subscription. Renamed to `railState`.
  2. `web/package.json` — `vite-plugin-top-level-await@1.6.0` + `@swc/core@1.16.1`
     (auto-resolved) hit a "missing field `type`" crash during build. Pinned
     `@swc/core: 1.15.43` in `resolutions` (matches the known-working version used by
     the reference repo `../proof-of-mind/web`).
  3. `web/vite.config.ts` — the blanket `@midnight-ntwrk/*` → filesystem-directory
     alias broke Vite/Rollup's conditional-exports resolution for
     `@midnight-ntwrk/ledger-v8` (that package has only an `exports` map, no legacy
     `main`/`module`). Excluded `ledger-v8` from the alias list (like
     `midnight-js-protocol` already was), switched its import in
     `web/src/lib/midnight/manager.ts` from `await import(...)` to a static top-level
     import, and added explicit `resolve.conditions: ['browser','module','import','default']`.
- `api/src`, `src/` (deploy/cli/providers/wallet/dust) — present from prior session,
  compiles under tsc; **not re-exercised against a live network this session**.

## Not done / blocked
- **No contract is deployed. No `deployment.json` exists — do not fabricate one.**
  Verified via curl this session: proof server `:6300`, indexer `:8088`, node `:9944`
  are all unreachable from this shell. `docker` CLI is not present (WSL without Docker
  Desktop integration). `yarn test` (vitest suite) was started and hung/timed out after
  60s, consistent with it trying to reach a network or spin up testcontainers — killed,
  not investigated further.
- `web/src/lib/midnight/config.ts` has `contractAddress: ''`; terminal UI already shows
  an honest "no contract deployed" warning banner (see `web/src/routes/terminal/+page.svelte`).

## Exact next step
Once docker/network access is available:
```
cd /home/fahmin/midnight/aetheria
yarn env:up                 # docker compose: node + indexer
yarn compile && yarn test:local
yarn deploy:undeployed      # or deploy:preview / deploy:preprod
# then paste the printed contract address into web/src/lib/midnight/config.ts
# (contractAddress field), commit deployment.json only if deploy.ts writes a real one.
yarn web:dev                # smoke-test terminal against the real deployment
```
If network still unreachable, next best step is polishing web/ further (e.g. code-splitting
the ~1.4MB `ledger_wasm` chunk warning from the build, or expanding SimulatedTerminal demo)
— but deploy is the actual blocker for an end-to-end verified dapp.

## Decisions a fresh session should know
- Reference implementation for wallet-connect patterns: `/home/fahmin/midnight/proof-of-mind`
  (React, not Svelte — port patterns, not files).
- `web/` was untracked (not yet committed) at start of this session; now tracked.
- Do not run `yarn test` without a timeout — it hangs when node/indexer/docker are absent.
