/**
 * Shared Aetheria contract API — browser (wallet-connected) and CLI.
 */
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  ContractState,
  fromHex,
  type ContractAddress,
} from '@midnight-ntwrk/compact-runtime';

import { CompiledAetheriaContract, ledger } from '../../contract/compiled.js';
import type { AetheriaPrivateState } from '../../contract/witnesses.js';
import {
  aetheriaPrivateStateKey,
  type AetheriaProviders,
  type DeployedAetheriaContract,
  type SolvencyState,
} from './common-types.js';

export class AetheriaAPI {
  readonly contractAddress: ContractAddress;

  private constructor(
    private readonly deployedContract: DeployedAetheriaContract,
    private readonly providers: AetheriaProviders,
  ) {
    this.contractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.contractAddress);
  }

  /** Submit an order commitment (32 bytes, hex string, no 0x prefix required). */
  async placeOrder(commitHex: string): Promise<void> {
    const h = commitHex.trim().toLowerCase().replace(/^0x/, '');
    if (!/^[0-9a-f]{64}$/.test(h)) {
      throw new Error('Order commitment must be 64 hex characters.');
    }
    await (this.deployedContract as any).callTx.placeOrder(fromHex(h));
  }

  /** Prove witness-held collateral covers witness-held debt at the public ratio. */
  async proveSolvency(): Promise<void> {
    await (this.deployedContract as any).callTx.proveSolvency();
  }

  static decodeSolvencyState(stateHex: string, networkId?: NetworkId): SolvencyState {
    if (networkId !== undefined) {
      setNetworkId(networkId);
    }
    const contractState = ContractState.deserialize(fromHex(stateHex));
    const l = ledger(contractState.data);
    return {
      orderCount: Number(l.orderCount as unknown as bigint),
      requiredRatioBps: Number(l.requiredRatioBps as unknown as bigint),
      solvencyOk: Boolean(l.solvencyOk),
      solvencyEpoch: Number(l.solvencyEpoch as unknown as bigint),
    };
  }

  static async fetchSolvencyState(
    queryUrl: string,
    contractAddress: string,
    networkId?: NetworkId,
  ): Promise<SolvencyState> {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `query LATEST_CONTRACT_STATE($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }`,
        variables: { address: contractAddress },
      }),
    });
    if (!res.ok) throw new Error(`Indexer HTTP error: ${res.status}`);
    const payload: any = await res.json();
    if (payload.errors?.length) {
      throw new Error(payload.errors.map((e: { message: string }) => e.message).join('; '));
    }
    const hex = payload.data?.contractAction?.state ?? null;
    if (!hex) {
      return { orderCount: 0, requiredRatioBps: 0, solvencyOk: false, solvencyEpoch: 0 };
    }
    return AetheriaAPI.decodeSolvencyState(hex, networkId);
  }

  static async deploy(
    providers: AetheriaProviders,
    privateState: AetheriaPrivateState,
    requiredRatioBps: bigint,
  ): Promise<AetheriaAPI> {
    const deployedContract = await (deployContract as any)(providers, {
      compiledContract: CompiledAetheriaContract,
      privateStateId: aetheriaPrivateStateKey,
      initialPrivateState: privateState,
      args: [requiredRatioBps],
    });
    return new AetheriaAPI(deployedContract, providers);
  }

  static async join(
    providers: AetheriaProviders,
    contractAddress: ContractAddress,
    privateState: AetheriaPrivateState,
    compiledContract: typeof CompiledAetheriaContract = CompiledAetheriaContract,
  ): Promise<AetheriaAPI> {
    const deployedContract = await findDeployedContract(providers as any, {
      contractAddress,
      compiledContract,
      privateStateId: aetheriaPrivateStateKey,
      initialPrivateState: privateState,
    });
    return new AetheriaAPI(deployedContract, providers);
  }
}

export * from './common-types.js';
