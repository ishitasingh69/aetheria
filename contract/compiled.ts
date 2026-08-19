import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { witnesses } from './witnesses.js';
import { Contract } from './managed/aetheria/contract/index.js';

/** Browser — relative asset path resolved by FetchZkConfigProvider. */
export const CompiledAetheriaContract = CompiledContract.make(
  'AetheriaContract',
  Contract,
).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets('./managed/aetheria'),
);

export {
  Contract,
  ledger,
  pureCircuits,
  type Ledger,
  type ImpureCircuits,
  type PureCircuits,
} from './managed/aetheria/contract/index.js';
