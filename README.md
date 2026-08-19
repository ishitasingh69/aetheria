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
contract/       aetheria.compact, witnesses.ts
docs/
  protocol.md     state machine, circuits, solvency accumulator
  matching.md     order commitments, crossing proofs, auction mechanics
  interface.md    terminal ui spec, latency budget, onboarding
node/           deploy + cli + vitest
app/            sveltekit
```

---

### run

node 22, docker, `compact` 0.31.1, lace on preprod.

```
pnpm i
pnpm env:up
pnpm compile          # compact compile +0.31.1 contract/aetheria.compact contract/managed
pnpm test             # undeployed network
pnpm deploy:preprod
pnpm dev              # :5173
```

---

### status

spec complete. contract surface drafted. no audit. do not put real size through
this.

MIT.
