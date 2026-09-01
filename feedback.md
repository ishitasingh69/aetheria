# Aetheria — Feedback Log

Source: 50-tester preprod panel (see [`users.md`](./users.md) / [`users.csv`](./users.csv)).
Window: 2026-08-25 → 2026-08-31. Average rating **3.82 / 5**, 37/50 rated 4★+.

> Generated test cohort — see the provenance note in `users.md`.

## Score distribution

```
5★  ███████████████ 15
4★  ██████████████████████ 22
3★  ████ 4
2★  ███████ 7
1★  ██ 2
```

## Top requests (by mentions)

| Rank | Request | Mentions | Triage |
|---|---|---|---|
| 1 | The liquidation threshold UI needs a worked example | 10 | **accepted — next milestone** |
| 2 | Proof time on placeOrder is noticeable at peak | 10 | accepted — backlog |
| 3 | I want partial fills before I route real size | 8 | under review |
| 4 | No order history export yet | 7 | under review |

## Representative quotes

- **Bianca Nilsen** (risk analyst, 5★) — “Placing an order felt like a normal DEX, not a ZK demo. Nothing I would block a rollout on.”
- **Mateo Eriksen** (desk trader, 5★) — “The solvency rail updated every block without leaking my book. Nothing I would block a rollout on.”
- **Riya Haddad** (market maker, 5★) — “Collateral ratios staying private is the whole reason I am here. Nothing I would block a rollout on.”
- **Ines Kim** (desk trader, 1★) — “Could not get through a full run. The liquidation threshold UI needs a worked example — I will retry after the next release.”
- **Kwame Bergstrom** (treasury manager, 1★) — “Could not get through a full run. Proof time on placeOrder is noticeable at peak — I will retry after the next release.”

## Triage process

1. Panel feedback lands in `users.csv` with a rating and a free-text note.
2. Notes are clustered into the request table above; count = number of testers raising it.
3. Rank 1 enters the next milestone; rank 2 goes to backlog; the rest are reviewed at the next checkpoint.
4. Shipped items are recorded in the README changelog and the tester is re-surveyed.
