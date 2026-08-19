# protocol

aetheria · state machine and circuit surface · rev 4

---

## 1. objects

```
Order      = { side, limitPrice, size, expiry, owner, salt }
OrderCommit= H(DOM_ORDER ‖ side ‖ limitPrice ‖ size ‖ expiry ‖ owner ‖ salt)
Position   = { collateral, debt, asset, owner, salt }
PosCommit  = H(DOM_POS ‖ collateral ‖ debt ‖ asset ‖ owner ‖ salt)
Note       = { asset, amount, owner, salt }        // shielded balance leaf
```

all commitments land in an append-only merkle tree on the ledger. spends are
nullified, never deleted. depth 32.

## 2. ledger

```compact
export ledger orderTree: MerkleTree<32, Bytes<32>>;
export ledger noteTree: MerkleTree<32, Bytes<32>>;
export ledger posTree: MerkleTree<32, Bytes<32>>;
export ledger spent: Set<Bytes<32>>;
export ledger fills: Counter;
export ledger openPositions: Counter;
export ledger solvencyOk: Boolean;
export ledger solvencyEpoch: Counter;
export ledger aggCollateral: Field;     // homomorphic accumulator, blinded
export ledger aggDebt: Field;
export ledger oracleRoot: Bytes<32>;
export ledger auctions: Map<Bytes<32>, Auction>;
```

`aggCollateral` / `aggDebt` are pedersen-style accumulators over blinded values.
they move on every deposit/borrow/repay so no epoch-boundary recomputation is
needed; the solvency circuit proves a relation over them, not over the tree.

## 3. circuits

### 3.1 `placeOrder(commit)`
inserts `commit` into `orderTree`. no witness beyond the maker's salt. cost
~30k constraints. the only thing the chain learns is that an order exists.

### 3.2 `cancelOrder()`
witness: the order preimage + merkle path. asserts membership, inserts the
nullifier `H(DOM_NULL ‖ commit ‖ ownerSk)`. cancellation is indistinguishable
from a fill at the ledger level — deliberate, it hides book depletion.

### 3.3 `match(fillCommitA, fillCommitB)`

the core. witnesses: both order preimages, both merkle paths, both owner keys
are **not** required — the taker holds their own key and the maker's order is
signed into the commitment, so the taker proves against a maker-authorised
object without impersonating them.

asserts:

```
1. membership(orderA, orderTree) ∧ membership(orderB, orderTree)
2. ¬spent(nullA) ∧ ¬spent(nullB)
3. sideA ≠ sideB
4. bid.limitPrice ≥ ask.limitPrice                    // crossing
5. fillSize ≤ min(sizeA, sizeB)
6. fillPrice ∈ [ask.limitPrice, bid.limitPrice]       // price improvement band
7. currentEpoch ≤ min(expiryA, expiryB)
8. output notes conserve value:  in = out  per asset
```

writes: two nullifiers, up to four new notes (two fills, two remainders),
`fills.increment(1)`. **nothing about price or size is disclosed.** the epoch
volume bucket (§6) is the only quantitative leak and it is coarse by
construction.

constraint estimate: ~1.4M. this is the expensive one. prove time on a laptop
8–20s; a venue would run a proving cluster. we accept that matching is not
sub-second and design the ui around it (see interface.md §4).

### 3.4 `openPosition` / `adjust`
standard shielded borrow. asserts `collateral × oraclePrice ≥ debt × minRatio`
using an oracle leaf proven against `oracleRoot`. updates `aggCollateral`,
`aggDebt` homomorphically.

### 3.5 `proveLiquidatable(auctionId)`
witness: position preimage + path + oracle leaf. asserts
`collateral × price < debt × liqRatio`. **does not reveal which position.**
creates an auction record keyed by a nullifier-derived id. this is the
mechanism that removes the public liquidation signal: the market learns an
unhealthy position exists, not whose or where the threshold sat.

### 3.6 `bid(auctionId, sealedBid)`
`sealedBid` is an additively homomorphic commitment `g^v h^r`. bids accumulate
on-chain. no bid is readable before clearing.

### 3.7 `clear(auctionId)`
dutch decay: the reserve is a public function of elapsed blocks. the first
bidder to prove `v ≥ reserve(t)` at some `t` wins and opens only their own bid.
losing bids are refunded without ever opening. proof: knowledge of `(v, r)`
opening the winning commitment ∧ `v ≥ reserve(t)` ∧ the winner's bid is the
earliest such. the earliest-such clause is the subtle part — see matching.md §5.

### 3.8 `proveSolvency(epoch)`

run by anyone; keeper-incentivised. asserts:

```
aggCollateral_blinded  opens to C
aggDebt_blinded        opens to D
C ≥ D × requiredRatio
```

with `C`, `D` never disclosed. sets `solvencyOk = true`, `solvencyEpoch = epoch`.
if no one proves it inside the epoch window, `solvencyOk` flips false on the
next state touch and the ui goes red. **a venue that stops proving is
indistinguishable from a venue that cannot** — which is exactly the property
missing from off-chain dark pools.

## 4. oracle

prices enter as a signed merkle root of `(asset, price, timestamp)` leaves,
posted by a threshold committee. circuits check freshness against the current
epoch. a stale root fails liquidation proofs before it fails borrows — fail-safe
direction is toward *not* liquidating.

## 5. nullifier hygiene

```
DOM_ORDER  = "aeth:ord:1"
DOM_POS    = "aeth:pos:1"
DOM_NULL   = "aeth:nul:1"
DOM_AUC    = "aeth:auc:1"
DOM_SOLV   = "aeth:sol:1"
```

separate domains per object class. an order nullifier and a note nullifier for
the same salt must not collide; if they did, cancelling an order could burn a
note.

## 6. what leaks, and what we do about it

| leak | severity | mitigation |
|---|---|---|
| order count | low | decoy orders: the client posts k dummy commitments per real one, cancelled later at random. cost is real; it is a user setting, default k=1 |
| fill timing | medium | epoch batching. matches submitted in an epoch settle at the epoch boundary in randomised order |
| volume | medium | `fills` is a count, not a notional. notional is bucketed to powers of 2 in a separate public counter for market-data purposes, opt-in per venue |
| liquidation existence | accepted | this is the signal that keeps the market solvent. we hide *whose*, not *whether* |
| gas/fee side channel | low | uniform fee per circuit class |

honest statement: a well-resourced observer with a full mempool view and timing
correlation can probably cluster a heavy user's activity. this design raises the
cost substantially; it does not make it impossible.

## 7. failure and shutdown

`solvencyOk == false` for two consecutive epochs puts the contract in
**withdraw-only**: `match`, `openPosition` and `bid` reject; `cancelOrder`,
`repay` and `withdraw` continue. there is no admin key that can reverse this.
the switch is a function of proof staleness, not of governance.
