# interface

terminal ui spec · aetheria

---

## 1. stance

this is a professional tool. it should feel like a trading terminal, not a
consumer app: dense, keyboard-driven, monospaced, no illustration, no
onboarding carousel inside the app itself.

but the *landing* is a different audience — allocators, risk officers and
hackathon judges who are not traders. so the product splits hard:

```
aetheria.xyz          marketing surface. explains, does not trade.
app.aetheria.xyz      terminal. assumes competence.
```

## 2. visual system

| | |
|---|---|
| framework | sveltekit 2 / svelte 5 runes, no component library |
| css | plain css custom properties, one 400-line stylesheet, no tailwind |
| type | `JetBrains Mono` everything. 13px base, 12px in grids |
| bg | `#07090c`, panels `#0c1014`, hairlines `#1b2229` |
| ink | `#c8d3dd` primary, `#6b7a88` muted |
| bid | `#3fb950` · **ask** `#f85149` · **accent** `#e3b341` amber |
| radius | 2px. |
| motion | 90ms linear. numbers never animate — a tweening price is a lie |
| grid | 4px baseline, panels snap to a 12-col split you can drag |

no logo animation. no gradient. the only illustration in the entire app is the
solvency sparkline.

## 3. layers

```
L0  landing            — thesis, the two diagrams, one demo video
L1  vault/connect      — lace, network check, shielded balance
L2  terminal           — order entry, positions, fills, solvency rail
L3  auction room       — live liquidations, sealed bid entry
L4  risk               — your positions, private ratio, distance to liquidation
```

## 4. the latency problem

a `match` proof takes 8–20 seconds. a trader will not accept a frozen ui for 20
seconds, and a spinner reads as broken. how we handle it:

- order submission is **optimistic and local**: the order appears in your blotter
  with state `proving` the instant you hit enter.
- the proving stage is shown as a **four-segment pipeline** — `witness →
  constraints → proof → submit` — with each segment filling. seeing motion
  through named stages reads as work; a spinner reads as a hang.
- estimated time is computed from constraint count, shown as a countdown, and is
  allowed to be wrong in the *pessimistic* direction only.
- everything else stays interactive. proving runs in a worker.
- if the tab is backgrounded, completion fires a notification.

## 5. order entry

single keyboard-first form, no modal:

```
[ b ]uy  [ s ]ell     size  ______   limit ______   expiry [ 1h ▾ ]
                                              ⏎ commit    esc clear
```

`b`/`s` toggle side from anywhere on the terminal. tab cycles fields. enter
commits. every numeric field is monospaced with tabular figures so digits do not
jitter as you type.

before commit, an inline **disclosure line** (not a modal):

> publishes: 1 commitment. reveals: nothing. cost: ~30k constraints, ~1s.

that line is per-action and always present. traders should be able to read what
each button leaks without leaving the screen.

## 6. solvency rail

a permanent 32px strip along the top of the terminal:

```
SOLVENT ▸ proven 4 blocks ago ▸ ratio ≥ 1.25× ▸ next proof due in 26 blocks
```

states: `SOLVENT` (green hairline), `STALE` (amber, proof older than the epoch),
`WITHDRAW-ONLY` (red, fills the strip). the strip is the most important pixel in
the product — it is the thing a dark pool has never been able to show.

clicking it opens the proof history: epoch, prover, tx, constraint count.

## 7. positions & risk

the risk panel shows what only you can see: your collateral, debt, ratio, and
distance to liquidation as a **private** figure with a small lock glyph. beside
it, the public figure the market sees: nothing. the visual contrast between the
two columns — one full of numbers, one showing a dash — is the clearest
explanation of the product we have found, and it is a live panel, not a diagram.

## 8. auction room

a list of open auctions, each showing only: id, block opened, current reserve
curve (a decaying line), bid count. no size, no asset until clearing. bid entry
is one field and a bond checkbox. after clearing, the row expands to show what
became public.

## 9. non-trader path

for judges, allocators and the merely curious, the landing carries a **simulated
terminal** — the real ui, seeded with synthetic state, that runs in the browser
with no wallet. it demonstrates: place an order, watch a match prove, watch the
solvency rail tick, open an auction. the sim uses the same components and the
same proving pipeline with a mocked prover, so it cannot drift from reality.

the landing's three sections, in order: **the leak** (what a public order book
shows about you, rendered as a real ethereum mempool sample), **the fix** (state
split table), **the receipt** (live solvency rail from preprod). then the sim.

## 10. accessibility, briefly

dense does not mean inaccessible. minimum 12px, contrast checked at 4.5:1 on
`#07090c` (the muted grey is 4.6:1, verified). every keyboard shortcut has a
menu equivalent. `prefers-reduced-motion` stops the pipeline animation and shows
stage text only. colour is never the sole carrier — bid/ask also carry `+`/`−`
and position in the grid.
