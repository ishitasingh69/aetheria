/** Shared across deploy, CLI, tests, and browser — must stay in sync. */
export const aetheriaPrivateStateKey = 'aetheriaPrivateState' as const;
export type AetheriaPrivateStateId = typeof aetheriaPrivateStateKey;

/** Required collateral/debt ratio at deploy time, in basis points (e.g. 15000 = 1.5x). */
export const DEFAULT_REQUIRED_RATIO_BPS = 15_000n;
