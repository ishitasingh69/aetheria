import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { aetheriaPrivateStateKey } from '../../contract/constants.js';
import type { AetheriaPrivateState } from '../../contract/witnesses.js';

export { aetheriaPrivateStateKey };

export type AetheriaCircuitKeys = 'placeOrder' | 'proveSolvency';

export type AetheriaProviders = MidnightProviders<
  AetheriaCircuitKeys,
  typeof aetheriaPrivateStateKey,
  AetheriaPrivateState
>;
export type DeployedAetheriaContract = FoundContract<any>;

export type SolvencyState = {
  orderCount: number;
  requiredRatioBps: number;
  solvencyOk: boolean;
  solvencyEpoch: number;
};
