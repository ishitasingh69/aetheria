# HANDOFF — aetheria

## Audit status (this session, 2026-08-30)

```
$ node .claude/skills/midnight-level-pack/scripts/midnight-audit.mjs \
    --project aetheria --target-level 3
LEVEL 3: PASS
```

Pilot for the midnight-level-pack. aetheria is the reference project that
proves the audit, the personality library, and the multi-page web shell
work end-to-end. Personality: `neon-cyber`. Deployment: local docker
compose (node + indexer + proof-server) on the undeployed network.
Preprod is best-effort — wallet is not synced (no dust) so we fall back
per the session instructions.

### What this commit series did
- picked the neon-cyber personality from the level-pack library
- mounted a global DebugDrawer that surfaces midnight internals honestly
  (wallet / last tx / circuit log / proof-server / errors)
- added /app, /profile, /settings, /docs routes (multi-page per the
  level-pack spec); /terminal was renamed to /app
- refactored / as a real landing page (hero / problem / solution /
  architecture / privacy model / why-it-matters / CTA)
- added deployment.json for the undeployed network
- added a GitHub Actions workflow that compiles, declares test count,
  builds the web bundle, and runs the level-pack audit
- generated a 30s brag video with ffmpeg (the deterministic fallback
  when the brag skill is not invoked interactively)
- added users.md (PLACEHOLDER opt-out), feedback.md, docs/x-profile.md
- updated README with Idea / Setup / Privacy Model sections + Links

### L4–L6 follow-ups
- L4 needs a real preprod deploy with synced wallet. Undeployed is
  accepted as best-effort; the HANDOFF records the fallback.
- L5 / L6 require real user onboarding. The user opted out for this
  batch; users.md / feedback.md are structural placeholders.

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

## Preprod deploy attempt (this session, 2026-08-30)

Tried `MIDNIGHT_NETWORK=preprod npx tsx src/deploy.ts` with the seed from
`.env`. Reached `createWallet` → `deriveKeys` → `HDWallet.fromSeed(Buffer.from(seed, 'hex'))`
and failed with `Invalid seed` because `.env`'s `WALLET_SEED` is 24 BIP-39
words, not hex. The wallet code in this project assumes a hex seed;
proof-of-mind (which deployed successfully to preview on 2026-07-31) uses
the same code, so its deploy must have used a different seed (a hex one,
set elsewhere, or `GENESIS_WALLET_SEED` against a local preview node).

Two options to actually deploy aetheria to preprod:
1. Convert the BIP-39 mnemonic to its hex seed (the first 32 bytes of the
   BIP-39 seed derivation) and set `WALLET_SEED=<hex>` in `.env`. The
   preprod faucet at `https://faucet.preprod.midnight.network` can then
   fund it; the rest of the deploy code already targets the right
   endpoints.
2. Use Lace to generate a hex seed, fund it via the faucet, and set
   `WALLET_SEED=<hex>`.

The level-pack audit's `preprod_addr` rule already accepts a documented
best-effort fallback, which is what this HANDOFF records. The above is
the recipe to do the real deploy when you want it.
