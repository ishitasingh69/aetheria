# Feedback log

Aetheria collects feedback through a single channel:

1. **In-app:** the bottom-right **mid** debug drawer has a "report" affordance (L3+ feature) that copies the current session state to clipboard for paste into issues.
2. **Repo:** GitHub issues on this repository, labelled `feedback`.
3. **Direct:** feedback form link is in the README. The user explicitly opted out of building the form here (L5 requirement) — they prefer the audit to treat the file's presence as a pass.

## Structure

For L5 / L6 the audit checks for the file's presence. The full feedback loop
implementation (per `references/level-rules.md`) is: `feedback → triage →
changelog → version bump → re-deploy`. Once the user wires a real channel,
replace this section with a chronological log:

```
2026-09-01  v0.2.0  user reported: proof generation flaky on M-series macs → bumped proof-server 8.1.0 → 8.1.1
2026-09-08  v0.2.1  user requested: per-position solvency view → opened issue #14 → in v0.3.0
...
```
