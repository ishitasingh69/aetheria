import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';

/**
 * Local private state — collateral/debt values never leave the client.
 * Only their relation to the public required ratio is proven on-chain.
 */
export type AetheriaPrivateState = {
  collateralValue: bigint;
  debtValue: bigint;
};

export const witnesses = {
  collateralValue: (context: WitnessContext<AetheriaPrivateState>) =>
    [context.privateState, context.privateState.collateralValue] as const,
  debtValue: (context: WitnessContext<AetheriaPrivateState>) =>
    [context.privateState, context.privateState.debtValue] as const,
};

export function createInitialPrivateState(
  collateralValue: bigint,
  debtValue: bigint,
): AetheriaPrivateState {
  return { collateralValue, debtValue };
}
