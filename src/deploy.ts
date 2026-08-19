import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import pino from 'pino';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getConfig } from './config.js';
import { ensureDust } from './dust.js';
import { createProviders } from './providers.js';
import {
  createWallet,
  resolveDeploySeed,
  waitForSyncedWallet,
} from './wallet.js';
import { CompiledAetheriaContract, zkConfigPath } from '../contract/index.js';
import { aetheriaPrivateStateKey, DEFAULT_REQUIRED_RATIO_BPS } from '../contract/constants.js';
import { createInitialPrivateState } from '../contract/witnesses.js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: { target: 'pino-pretty' },
});

// Deploy-time placeholder witness values. A real trader supplies their own
// collateral/debt via the CLI or web terminal before calling proveSolvency.
const COLLATERAL_VALUE = 0n;
const DEBT_VALUE = 0n;

async function main() {
  const config = getConfig();
  const seed = resolveDeploySeed(config.networkId);
  setNetworkId(config.networkId);

  logger.info(`Deploying on ${config.networkId}`);
  if (config.networkId === 'preview' || config.networkId === 'preprod') {
    logger.info('Ensure proof server is running at http://127.0.0.1:6300');
  } else {
    logger.info('Using local endpoints (run yarn env:up if needed)');
    if (process.env['USE_CUSTOM_WALLET'] !== '1') {
      logger.info('Using genesis wallet (pre-funded on local devnet)');
    }
  }

  const walletCtx = await createWallet(config, seed);
  await waitForSyncedWallet(walletCtx.wallet, 600_000);
  await ensureDust(walletCtx);

  const providers = createProviders(walletCtx, zkConfigPath, config, 'deploy');

  const deployed: any = await (deployContract as any)(providers, {
    compiledContract: CompiledAetheriaContract,
    privateStateId: aetheriaPrivateStateKey,
    initialPrivateState: createInitialPrivateState(COLLATERAL_VALUE, DEBT_VALUE),
    args: [DEFAULT_REQUIRED_RATIO_BPS],
  });

  const contractAddress = deployed.deployTxData.public.contractAddress;
  logger.info(`Contract deployed at: ${contractAddress}`);

  const deploymentRecord = {
    network: config.networkId,
    contractAddress,
    requiredRatioBps: DEFAULT_REQUIRED_RATIO_BPS.toString(),
    deployedAt: new Date().toISOString(),
  };

  const outPath = resolve(process.cwd(), 'deployment.json');
  writeFileSync(outPath, JSON.stringify(deploymentRecord, null, 2));
  logger.info(`Wrote ${outPath}`);

  await walletCtx.wallet.stop();
}

main().catch((err) => {
  logger.error(err);
  process.exit(1);
});
