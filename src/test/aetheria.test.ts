import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { randomBytes } from 'node:crypto';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  deployContract,
  submitCallTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { fromHex } from '@midnight-ntwrk/compact-runtime';
import pino from 'pino';

import { getConfig } from '../config.js';
import { ensureDust } from '../dust.js';
import { createProviders, type AetheriaProviders } from '../providers.js';
import {
  GENESIS_WALLET_SEED,
  createWallet,
  waitForSyncedWallet,
} from '../wallet.js';
import { CompiledAetheriaContract, ledger, zkConfigPath } from '../../contract/index.js';
import { aetheriaPrivateStateKey, DEFAULT_REQUIRED_RATIO_BPS } from '../../contract/constants.js';
import { createInitialPrivateState } from '../../contract/witnesses.js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

describe('Aetheria Contract', () => {
  let walletCtx: Awaited<ReturnType<typeof createWallet>>;
  let aliceProviders: AetheriaProviders;
  let contractAddress: ContractAddress;

  const config = getConfig();

  async function queryLedger(providers: AetheriaProviders) {
    const state =
      await providers.publicDataProvider.queryContractState(contractAddress);
    expect(state).not.toBeNull();
    return ledger(state!.data);
  }

  beforeAll(async () => {
    setNetworkId(config.networkId);

    walletCtx = await createWallet(config, GENESIS_WALLET_SEED);
    await waitForSyncedWallet(walletCtx.wallet, 600_000);
    await ensureDust(walletCtx);

    aliceProviders = createProviders(walletCtx, zkConfigPath, config, 'test');
    logger.info('Providers initialized. Ready to test!');
  });

  afterAll(async () => {
    if (walletCtx) {
      logger.info('Stopping wallet...');
      await walletCtx.wallet.stop();
    }
  });

  it('deploys the contract with a required ratio', async () => {
    const deployed: any = await (deployContract as any)(aliceProviders, {
      compiledContract: CompiledAetheriaContract,
      privateStateId: aetheriaPrivateStateKey,
      initialPrivateState: createInitialPrivateState(0n, 0n),
      args: [DEFAULT_REQUIRED_RATIO_BPS],
    });

    contractAddress = deployed.deployTxData.public.contractAddress;
    logger.info(`Contract deployed at: ${contractAddress}`);
    expect(contractAddress).toBeDefined();

    const state = await queryLedger(aliceProviders);
    expect(state.orderCount).toEqual(0n);
    expect(state.requiredRatioBps).toEqual(DEFAULT_REQUIRED_RATIO_BPS);
    expect(state.solvencyOk).toBe(true);
  });

  it('commits an order without disclosing anything but its existence', async () => {
    const commit = randomBytes(32);

    await (submitCallTx as any)(aliceProviders, {
      compiledContract: CompiledAetheriaContract,
      contractAddress,
      privateStateId: aetheriaPrivateStateKey,
      circuitId: 'placeOrder',
      args: [commit],
    });

    const state = await queryLedger(aliceProviders);
    expect(state.orderCount).toEqual(1n);
    expect(state.orders.member(commit)).toBe(true);
  });

  it('proves solvency when witness collateral covers witness debt', async () => {
    await (submitCallTx as any)(aliceProviders, {
      compiledContract: CompiledAetheriaContract,
      contractAddress,
      privateStateId: aetheriaPrivateStateKey,
      circuitId: 'proveSolvency',
      args: [],
      privateState: createInitialPrivateState(150n, 100n),
    });

    const state = await queryLedger(aliceProviders);
    expect(state.solvencyOk).toBe(true);
    expect(state.solvencyEpoch).toEqual(1n);
  });
});
