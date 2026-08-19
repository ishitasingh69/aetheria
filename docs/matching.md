# matching

order lifecycle, crossing proofs, auction mechanics · rev 2

---

## 1. book model

there is no book. there is a set of commitments and an off-chain **relay** that
holds encrypted order metadata so takers can find a crossing counterparty.

```
maker ──encrypt(order, relayPubKey)──► relay ──► taker (subscribed)
  │                                                    │
  └──placeOrder(commit)──► ledger ◄──match(proof)──────┘
```

the relay learns orders. that is a real trust assumption and we name it rather
than hide it behind "decentralised". three notes:

- the relay **cannot steal**: it holds no keys, and every fill requires the
  taker's own proof and a value-conservation check.
- the relay **cannot forge**: an order commitment binds the maker's terms.
- the relay **can front-run its own users**. mitigations, in increasing cost:
  1. multiple competing relays, taker chooses;
  2. relay runs in a TEE with remote attestation published on-chain;
  3. threshold relay — order metadata secret-shared across n relays, `t` needed
     to reconstruct, no single operator sees a book.

v1 ships (1). v2 targets (3). we do not pretend (1) is trustless.

## 2. order encoding

```
side       : 1 bit
limitPrice : Uint<64>   fixed point, 8 decimals
size       : Uint<64>   base units
expiry     : Uint<32>   epoch
owner      : Bytes<32>  public key
salt       : Bytes<32>
```

commitment is a single `persistentHash` over the packed tuple. packing matters:
64+64+32 fits comfortably and keeps the hash to two field elements.

## 3. the crossing proof

the interesting constraint is (6) from protocol.md — the fill price must sit
inside `[ask, bid]`. we do **not** let the taker pick freely inside the band,
because that is a hidden fee. the rule:

```
fillPrice = ask.limitPrice + (bid.limitPrice - ask.limitPrice) / 2
```

midpoint, enforced in-circuit with an exactness check on the division
(`2·fillPrice == ask + bid` for even spreads, floor toward the ask for odd).
this is a venue policy encoded as a constraint, which is the whole point of
doing it in a circuit: the fairness rule is not a promise, it is unprovable to
violate.

## 4. partial fills

remainders are re-committed as fresh orders with new salts and the *same*
expiry, and the original nullifier is burned. an observer sees one nullifier and
one new commitment — identical to a cancel-and-replace. size is not inferable
from the count of remainder commitments because a full fill also emits a dummy
commitment (a zero-size order, immediately cancellable).

## 5. dutch auction clearing

reserve decays linearly from `startPrice` to `floorPrice` over `D` blocks:

```
reserve(t) = startPrice - (startPrice - floorPrice) × (t - t0) / D
```

**earliest-winner.** because bids are sealed, we cannot rank them on-chain
without opening. instead:

1. each bid commitment is stored with its submission block.
2. after `D`, any bidder may claim by opening their bid and proving
   `v ≥ reserve(t_i)` where `t_i` is *their* submission block.
3. the contract accepts the claim with the **smallest** `t_i` among all claims
   received in a fixed challenge window `W`.
4. unclaimed bids are refundable after `W` without opening.

property: a bidder who bid above the reserve at an early block always wins if
they claim, and they cannot be beaten by a later, larger bid. this is a genuine
dutch auction, not a sealed first-price auction pretending to be one.

the failure mode is a bidder who wins and never claims. handled by requiring a
small forfeitable bond with the bid, refunded on claim or on proven-losing.

## 6. liquidation flow end to end

```
keeper: proveLiquidatable(posNullifier) ──► auction opens, id = H(DOM_AUC ‖ null)
        └─ ledger learns: an auction exists. not which position, not the size.

bidders: bid(id, commit) × n            ──► sealed, homomorphic

after D: clear(id) ──► winner opens own bid, proves v ≥ reserve(t_win)
        └─ position's debt is repaid from the winning bid
        └─ collateral moves to winner as shielded notes
        └─ borrower's remainder returns to borrower

ledger learns: auction id, that it cleared, at which block. not the size,
not the collateral, not the borrower.
```

the borrower's protection is that their liquidation was never announced with a
price attached, so the usual "everyone dumps into the same liquidation" cascade
has nothing to coordinate on.

## 7. matching engine budget

| circuit | constraints (est.) | prove (laptop) | prove (16-core) |
|---|---|---|---|
| placeOrder | 30 k | 0.8 s | 0.3 s |
| cancelOrder | 190 k | 3 s | 1 s |
| match | 1.4 M | 14 s | 4 s |
| openPosition | 320 k | 5 s | 1.6 s |
| proveLiquidatable | 280 k | 4 s | 1.4 s |
| bid | 45 k | 1 s | 0.4 s |
| clear | 210 k | 3.5 s | 1.2 s |
| proveSolvency | 60 k | 1.2 s | 0.5 s |

`match` dominates. optimisation path, in order: (a) fold the two membership
proofs into one batched merkle verification, (b) drop tree depth to 28 with
periodic subtree archival, (c) move the value-conservation check to a lookup
argument. estimated combined saving ~40%.
