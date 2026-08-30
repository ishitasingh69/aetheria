# aetheria

dark pool + credit market on midnight. orders, sizes, collateral ratios and
liquidation thresholds live in private state. solvency is public and continuous.

```
public:   Σ collateral, Σ debt, utilisation, solvency proof height
private:  every order, every position, every threshold, every counterparty
```

---

### why

three things break institutional flow on transparent chains:

1. **order leakage.** a resting bid is a free option written to the whole
   mempool. size and price are alpha; publishing them is paying to be picked off.
2. **liquidation cascades.** public thresholds are a coordination signal. bots
   pile in at the same tick, slippage spikes, the borrower eats it.
3. **no credible solvency.** the alternative — trust an off-chain venue — got
   people killed in 2022. you cannot audit a dark pool that publishes nothing.

aetheria takes the position that (1) and (2) require privacy, (3) requires
proof, and midnight is the only place you can have both in one state machine.

---

### initial product idea

an institutional venue where the order book is a set of commitments in shielded
state and matching happens through zk proofs of crossing rather than through a
public book. a maker commits `(side, limit, size, expiry)` and a nullifier. a
taker proves — without opening either order — that two commitments cross, that
both are unexpired, and that fill size is bounded by both. settlement moves
shielded balances. lending sits on the same state: a borrower's collateral ratio
is a private value; liquidation eligibility is proven, not announced, and the
liquidation itself runs as a sealed-bid dutch auction where bids are homomorphic
commitments opened only at clearing. against all of that, the ledger carries a
rolling proof of solvency: aggregate collateral ≥ aggregate debt × required
ratio, proven every epoch over the private position set without opening a single
position. traders get opacity, the market gets arithmetic.

---

### state split

| | private (witness / local) | public (ledger) |
|---|---|---|
| order | side, price, size, owner | commitment, nullifier on fill |
| position | collateral, debt, entry, liq. price | position count, aggregate roots |
| fill | price, size, both counterparties | fill count, epoch volume bucket |
| liquidation | bid vector, winner's bid | auction id, clearing epoch, outcome flag |
| solvency | every position | `solvencyOk: Boolean`, `provenAtEpoch: Counter` |

what necessarily leaks: cardinality and timing. §6 of [docs/protocol.md](docs/protocol.md)
covers the batching and decoy strategy that blunts it. we do not claim it is
eliminated.

---

### layout

```
contract/       aetheria.compact, witnesses.ts, managed/ (compiled zkir + keys, gitignored)
api/src/        AetheriaAPI: providers, join/deploy, placeOrder/proveSolvency, ledger reads
src/            deploy.ts, cli.ts, providers.ts, wallet.ts, dust.ts, vitest suite
docs/
  protocol.md     state machine, circuits, solvency accumulator
  matching.md     order commitments, crossing proofs, auction mechanics
  interface.md    terminal ui spec, latency budget, onboarding
web/            sveltekit 2 terminal ui (plain css, no tailwind), real wallet connect
```

---

### run

node 22, docker, `compact` 0.5.1 (`compact compile +0.31.1 ...`), yarn 1.x, lace/1AM wallet.

```
yarn install
yarn env:up            # docker compose: node + indexer (needs docker; not available in every shell)
yarn compile           # contract/aetheria.compact -> contract/managed/aetheria
yarn test:local        # vitest against undeployed network
yarn deploy:undeployed  # writes deployment.json — never fabricate this file by hand
yarn web:install && yarn web:dev   # sveltekit terminal, :5173
yarn web:build          # static build via adapter-static -> web/build
```

---

### status (2026-08-20)

- **contract**: `aetheria.compact` compiles clean (`yarn compile` — 2 circuits, `placeOrder` +
  `proveSolvency`). `npx tsc --noEmit` at repo root is clean.
- **node-side stack** (`api/src`, `src/`): deploy/cli/providers/wallet/dust wired up per prior
  session; vitest suite present at `src/test/aetheria.test.ts`. Not re-run against a live
  network this session (see below).
- **web/** (sveltekit terminal): full app scaffolded — landing page, `/terminal` route,
  `SolvencyRail`/`WalletBar`/`SimulatedTerminal` components, real wallet-connect manager
  mirroring the `proof-of-mind` reference (dapp-connector-api, in-memory private state
  provider, fetch zk config provider, http proof provider, indexer public data provider).
  `svelte-check` is clean (0 errors) and `yarn web:build` produces a working static build in
  `web/build`. Fixed this session: a `$state`-shadowing bug in `SolvencyRail.svelte` (a local
  `state` variable collided with Svelte 5's `$state` rune, misparsed as a store
  auto-subscription), a `vite-plugin-top-level-await`/`@swc/core` version mismatch (pinned
  `@swc/core` to `1.15.43` via `web/package.json` resolutions to match the known-working
  version from the reference repo), and a Vite/Rollup resolution failure on
  `@midnight-ntwrk/ledger-v8` (an exports-only package with no legacy `main`/`module` field —
  excluded it from the blanket `@midnight-ntwrk/*` directory-alias list, switched its import
  in `manager.ts` from dynamic to static, and added explicit `resolve.conditions` in
  `web/vite.config.ts`).
- **no contract is deployed.** This session verified `http://127.0.0.1:6300` (proof server),
  `:8088` (indexer) and `:9944` (node) are all unreachable, and `docker` is not available in
  this shell (WSL without Docker Desktop integration active). `deployment.json` does not exist
  and `web/src/lib/midnight/config.ts` has `contractAddress: ''`. The terminal UI renders and
  shows an explicit "no contract deployed" warning banner rather than pretending otherwise. Do
  not fabricate a deployment — run `yarn deploy:undeployed` (or `:preview`/`:preprod`) once a
  real network is reachable, then paste the resulting address into
  `web/src/lib/midnight/config.ts`.
- no audit. do not put real size through this.

MIT.

---

## Idea (level-pack section)

aetheria is a privacy-first dark pool and credit market on the Midnight network. the order book lives in shielded state, liquidations clear through sealed-bid dutch auctions with homomorphic commitments, and solvency is proven every epoch over the private position set without opening a single position. traders get opacity, the market gets arithmetic, and the venue can be audited by anyone without leaking any individual trader's strategy or collateral.

## Setup (level-pack section)

```bash
# 1. install toolchain (compact, docker, node 22, yarn)
# 2. bring up the local midnight stack (node + indexer + proof-server)
node .claude/skills/midnight-level-pack/scripts/midnight-up.mjs --project .
# 3. compile the compact contract
cd contract && compact compile +0.31.1 aetheria.compact managed/aetheria
# 4. deploy (undeployed by default; preprod is best-effort)
yarn deploy:undeployed
# 5. run the web
yarn web:dev
# 6. audit to your target level
node .claude/skills/midnight-level-pack/scripts/midnight-audit.mjs --project . --target-level 3
```

## Privacy Model (level-pack section)

| observer can see | observer cannot see |
|------------------|---------------------|
| aggregate collateral, aggregate debt, utilisation rate | order side, price, size, or owner |
| whether a rolling solvency proof exists for the current epoch | counterparty of any fill |
| that a position exists, but not its contents | any position's collateral ratio, debt size, or liquidation threshold |
| auction id, clearing epoch, and outcome flag | the bid vector or winning bid of a sealed-bid liquidation |
| that a fill happened between two commitments | the contents of either commitment |

`proveSolvency` is the privacy-critical primitive: it produces a ZK proof
that the private position set satisfies `Σ collateral ≥ Σ debt × required
ratio` at epoch N, *without* opening any position. the ledger only stores
`solvencyOk: Boolean` and `provenAtEpoch: Counter` — the proof itself lives
in the private state of whoever ran the circuit.

## Architecture (level-pack section)

aetheria is three layers, all running against the same Midnight state machine:

1. **Compact contract** (`contract/aetheria.compact`) — two circuits: `placeOrder` (commitment + nullifier) and `proveSolvency` (ZK proof of aggregate ratio). Compiled to ZK circuits + proving/verification keys under `contract/managed/aetheria/`.
2. **Node-side API** (`api/src/`, `src/`) — providers, wallet, dust, deploy, CLI, vitest. Reads indexer public state, signs transactions, never holds private state on disk.
3. **Browser shell** (`web/`) — SvelteKit 2 app: `/` (landing), `/app` (terminal), `/profile`, `/settings`, `/docs`. Lace wallet via `dapp-connector-api`; in-memory private state provider; fetch-zk + http proof + indexer public data providers.

The contract is the only source of truth. The two off-chain layers are
pluggable: you can replace the browser shell with a CLI, or the node API
with a server-side worker, without touching the contract.

## Links

- Live demo (vercel/netlify): https://aetheria-midnight.vercel.app _(placeholder — deploy on a free tier to satisfy L2)_
- X profile: https://x.com/aetheria-midnight _(placeholder — see `docs/x-profile.md`)_
- 50 / 70 preprod user list: `users.md` _(PLACEHOLDER — opt-out per session instructions)_
- Feedback log: `feedback.md`
- Level-pack audit: `.claude/skills/midnight-level-pack/SKILL.md`

