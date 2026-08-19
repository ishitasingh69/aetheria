import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { WebSocket } from 'ws';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

import { AetheriaAPI } from '../api/src/node.js';
import { CompiledAetheriaContract } from '../contract/index.js';
import { getConfig } from './config.js';
import { ensureDust } from './dust.js';
import { createProviders } from './providers.js';
import {
  createWallet,
  resolveDeploySeed,
  unshieldedToken,
  waitForSyncedWallet,
} from './wallet.js';
import { createInitialPrivateState } from '../contract/witnesses.js';
import { zkConfigPath } from '../contract/index.js';

// @ts-expect-error WebSocket global assignment for apollo
globalThis.WebSocket = WebSocket;

const PROVIDER_STORE_SUFFIX = 'deploy';

type DeploymentRecord = {
  network: string;
  contractAddress: string;
  requiredRatioBps?: string;
  deployedAt: string;
};

function loadDeployment(): DeploymentRecord {
  const path = resolve(process.cwd(), 'deployment.json');
  if (!existsSync(path)) {
    throw new Error('No deployment.json found. Run yarn deploy first.');
  }
  return JSON.parse(readFileSync(path, 'utf8')) as DeploymentRecord;
}

function truncHex(hex: string, head = 10, tail = 8): string {
  return hex.length <= head + tail + 1 ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

async function main() {
  const deployment = loadDeployment();
  if (!process.env['MIDNIGHT_NETWORK']) {
    process.env['MIDNIGHT_NETWORK'] =
      deployment.network === 'undeployed' ? 'local' : deployment.network;
  }

  const config = getConfig();
  const seed = resolveDeploySeed(config.networkId);
  setNetworkId(config.networkId);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       Aetheria CLI                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Contract: ${deployment.contractAddress}`);
  console.log(`  Network:  ${config.networkId}\n`);

  if (
    deployment.network !== config.networkId &&
    !(deployment.network === 'undeployed' && config.networkId === 'undeployed')
  ) {
    console.error(
      `  deployment.json is for "${deployment.network}" but MIDNIGHT_NETWORK is "${config.networkId}".`,
    );
    console.error(`  Run: MIDNIGHT_NETWORK=${deployment.network} yarn cli\n`);
    process.exit(1);
  }

  const rl = createInterface({ input: stdin, output: stdout });
  let collateralValue = 0n;
  let debtValue = 0n;

  try {
    console.log('  Connecting to wallet...');
    const walletCtx = await createWallet(config, seed);

    console.log('  Syncing with network...');
    console.log('  This may take several minutes depending on network size.');
    console.log('  RPC disconnection messages during sync are normal and can be safely ignored.\n');

    const syncStart = Date.now();
    const syncInterval = setInterval(() => {
      const elapsed = Math.round((Date.now() - syncStart) / 1000);
      process.stdout.write(`\r  Still syncing... (${elapsed}s elapsed)   `);
    }, 5000);

    await waitForSyncedWallet(walletCtx.wallet, 600_000);
    clearInterval(syncInterval);
    process.stdout.write('\r  Synced with network.                                      \n');

    const state = await walletCtx.wallet.waitForSyncedState();
    const tNight = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
    const dust = state.dust.balance(new Date());
    console.log(`  Balance: ${tNight.toLocaleString()} tNight`);
    console.log(`  DUST:    ${dust.toLocaleString()}\n`);

    if (tNight === 0n && config.networkId !== 'undeployed' && config.faucet) {
      console.log('  Wallet has no tNight. Fund it from the faucet to send transactions:');
      console.log(`     ${config.faucet}`);
      console.log(`     Wallet: ${walletCtx.unshieldedKeystore.getBech32Address()}\n`);
    }

    await ensureDust(walletCtx);

    console.log('  Joining contract via findDeployedContract...');
    const providers = createProviders(walletCtx, zkConfigPath, config, PROVIDER_STORE_SUFFIX);
    const privateState = createInitialPrivateState(collateralValue, debtValue);
    const api = await AetheriaAPI.join(
      providers,
      deployment.contractAddress,
      privateState,
      CompiledAetheriaContract,
    );

    console.log('  Connected.\n');

    let running = true;
    while (running) {
      console.log('─── Menu ───────────────────────────────────────────────────────');
      console.log('  1. Place order (random commitment)');
      console.log('  2. Read solvency rail (on-chain)');
      console.log('  3. Set local collateral / debt (witness values)');
      console.log('  4. Prove solvency');
      console.log('  5. Check wallet balance');
      console.log('  6. Exit\n');

      const choice = await rl.question('  Your choice: ');

      switch (choice.trim()) {
        case '1': {
          const commit = randomBytes(32).toString('hex');
          console.log(`\n  Submitting placeOrder(${truncHex(commit, 10, 6)})...`);
          try {
            await api.placeOrder(commit);
            console.log('\n  Order committed.\n');
          } catch (error) {
            console.error('\n  Failed:', error instanceof Error ? error.message : error, '\n');
          }
          break;
        }

        case '2': {
          console.log('\n  Reading solvency rail from indexer...');
          try {
            const solvency = await AetheriaAPI.fetchSolvencyState(
              config.indexer,
              deployment.contractAddress,
            );
            console.log(`\n  Orders committed:  ${solvency.orderCount}`);
            console.log(`  Required ratio:    ${solvency.requiredRatioBps / 100}%`);
            console.log(`  Solvent:           ${solvency.solvencyOk ? 'YES' : 'NO'}`);
            console.log(`  Solvency epoch:    ${solvency.solvencyEpoch}\n`);
          } catch (error) {
            console.error('\n  Failed:', error instanceof Error ? error.message : error, '\n');
          }
          break;
        }

        case '3': {
          const cStr = await rl.question('  Collateral value: ');
          const dStr = await rl.question('  Debt value: ');
          try {
            collateralValue = BigInt(cStr.trim() || '0');
            debtValue = BigInt(dStr.trim() || '0');
            console.log('\n  Local witness values updated (not on-chain until you prove).\n');
          } catch {
            console.log('\n  Invalid numbers.\n');
          }
          break;
        }

        case '4': {
          console.log('\n  Submitting proveSolvency (this may take a while)...');
          try {
            const freshPrivateState = createInitialPrivateState(collateralValue, debtValue);
            const freshApi = await AetheriaAPI.join(
              providers,
              deployment.contractAddress,
              freshPrivateState,
              CompiledAetheriaContract,
            );
            await freshApi.proveSolvency();
            console.log('\n  Solvency proven.\n');
          } catch (error) {
            console.error('\n  Failed:', error instanceof Error ? error.message : error, '\n');
          }
          break;
        }

        case '5': {
          const current = await walletCtx.wallet.waitForSyncedState();
          const currentTNight =
            current.unshielded.balances[unshieldedToken().raw] ?? 0n;
          const currentDust = current.dust.balance(new Date());
          console.log(`\n  tNight: ${currentTNight.toLocaleString()}`);
          console.log(`  DUST:   ${currentDust.toLocaleString()}\n`);
          break;
        }

        case '6':
          running = false;
          console.log('\n  Goodbye.\n');
          break;

        default:
          console.log('\n  Invalid choice. Please enter 1-6.\n');
      }
    }

    await walletCtx.wallet.stop();
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
