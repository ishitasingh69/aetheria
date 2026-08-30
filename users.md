# users.md

> **PLACEHOLDER — opt-out (per session instructions)**
>
> L5 requires a list of 50 preprod user wallet addresses, L6 requires 70.
> The user explicitly opted out of real human onboarding for this batch of
> projects. This file is the structural placeholder: an audit passing
> `hasUsersMd(p, 50)` / `hasUsersMd(p, 70)` requires the file to exist and
> either contain ≥ N verifiable addresses OR carry the `PLACEHOLDER` opt-out
> marker above.
>
> When the user later runs an actual onboarding campaign, replace this
> section with a real list of preprod addresses (one per line, prefixed
> `addr1` for Midnight's Bech32 format).

## Format

```
addr1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx, 2026-09-01, onboarding-step-3
addr1yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy, 2026-09-01, onboarding-step-3
...
```

## Why 50 / 70?

Midnight uses Bech32m addresses starting with `addr1`. The audit counts
entries that match the `addr1[0-9a-z]{20,}` shape (or `0x[0-9a-fA-F]{40}`
fallback). When the project moves off opt-out, the real numbers are
50 (L5) and 70 (L6).
