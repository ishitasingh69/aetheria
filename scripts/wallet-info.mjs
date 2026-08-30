// scripts/wallet-info.mjs
// Standalone wallet generation for aetheria on preprod.
//
// Usage:
//   MIDNIGHT_NETWORK=preprod node scripts/wallet-info.mjs [--fresh|--use-env]
//
//   --fresh       (default) generate a new 32-byte hex seed and build a wallet
//                 from it; print seed + unshielded address; save seed to .env
//                 so the rest of the toolchain can use it.
//   --use-env     use the existing WALLET_SEED in .env (must be hex).
//
// This script never sends a transaction; it only initialises the wallet
// against the indexer/node so it can read the unshielded bech32 address
// that the preprod faucet needs. No dust required for this step.

import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket;

import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  WalletFacade,
  ShieldedWallet,
  UnshieldedWallet,
  DustWallet,
  createKeystore,
  NoOpTransactionHistoryStorage,
  PublicKey,
} from '@midnight-ntwrk/wallet-sdk';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import * as Rx from 'rxjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

// Inline a copy of the project's getConfig() so this script is standalone.
const PREPROD_CONFIG = {
  networkId: 'preprod',
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preprod.midnight.network',
  nodeWS: 'wss://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
  faucet: 'https://faucet.preprod.midnight.network',
};
const PREVIEW_CONFIG = {
  ...PREPROD_CONFIG,
  networkId: 'preview',
  indexer: 'https://indexer.preview.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preview.midnight.network/api/v4/graphql/ws',
  node: 'https://rpc.preview.midnight.network',
  nodeWS: 'wss://rpc.preview.midnight.network',
  faucet: 'https://midnight-tmnight-preview.nethermind.dev',
};
const LOCAL_CONFIG = {
  networkId: 'undeployed',
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  node: 'http://127.0.0.1:9944',
  nodeWS: 'ws://127.0.0.1:9944',
  proofServer: 'http://127.0.0.1:6300',
  faucet: '',
};

function getConfig() {
  const network = process.env['MIDNIGHT_NETWORK'] ?? 'undeployed';
  if (network === 'local' || network === 'undeployed') return LOCAL_CONFIG;
  if (network === 'preview') return PREVIEW_CONFIG;
  if (network === 'preprod') return PREPROD_CONFIG;
  throw new Error(`Unknown network: ${network}`);
}

function readEnv() {
  const path = resolve(projectRoot, '.env');
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        const [k, ...rest] = l.split('=');
        return [k.trim(), rest.join('=').trim()];
      })
  );
}

const args = new Set(process.argv.slice(2));
const useEnv = args.has('--use-env');

const config = getConfig();
setNetworkId(config.networkId);

console.log(`\n[wallet-info] network: ${config.networkId}`);
console.log(`[wallet-info] node:    ${config.nodeWS}`);
console.log(`[wallet-info] indexer: ${config.indexerWS}`);

// 1. Pick a seed (32 bytes = 64 hex chars)
let seed;
if (useEnv) {
  const env = readEnv();
  if (!env.WALLET_SEED) {
    console.error('WALLET_SEED not in .env');
    process.exit(1);
  }
  seed = env.WALLET_SEED.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(seed)) {
    console.error('WALLET_SEED must be 64 hex chars (32 bytes). Currently:', seed.length, 'chars.');
    process.exit(1);
  }
  console.log(`[wallet-info] using seed from .env`);
} else {
  seed = randomBytes(32).toString('hex');
  console.log(`[wallet-info] generated fresh 32-byte hex seed`);
}

console.log(`\n╔════════════════════════════════════════════════════════════╗`);
console.log(`║              WALLET SEED (64 hex chars, 32 bytes)            ║`);
console.log(`╚════════════════════════════════════════════════════════════╝`);
console.log(`  ${seed}\n`);
console.log(`  Save this seed. Set it as WALLET_SEED in .env to re-use the wallet.`);

// 2. Derive keys via HDWallet
const hdWallet = HDWallet.fromSeed(Buffer.from(seed, 'hex'));
if (hdWallet.type !== 'seedOk') {
  console.error('HDWallet type !== seedOk');
  process.exit(1);
}
const keysResult = hdWallet.hdWallet
  .selectAccount(0)
  .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
  .deriveKeysAt(0);
if (keysResult.type !== 'keysDerived') {
  console.error('Key derivation failed');
  process.exit(1);
}
const keys = keysResult.keys;
hdWallet.hdWallet.clear();

const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], config.networkId);

// 3. Build the wallet facade (mirror src/wallet.ts)
console.log(`[wallet-info] building WalletFacade (sync ~30s)...`);
const walletConfig = {
  networkId: config.networkId,
  indexerClientConnection: {
    indexerHttpUrl: config.indexer,
    indexerWsUrl: config.indexerWS,
  },
  provingServerUrl: new URL(config.proofServer),
  relayURL: new URL(config.node.replace(/^http/, 'ws')),
  txHistoryStorage: new NoOpTransactionHistoryStorage(),
  costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
};

let wallet;
try {
  wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: async (cfg) => ShieldedWallet(cfg).startWithSecretKeys(shieldedSecretKeys),
    unshielded: async (cfg) =>
      UnshieldedWallet(cfg).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: async (cfg) =>
      DustWallet(cfg).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
    signing: async (cfg) => ({ sign: (data) => unshieldedKeystore.sign(data) }),
    encryption: async (cfg) => ({ encryptFor: (pk) => unshieldedKeystore.encryptFor(pk) }),
  });
} catch (e) {
  console.error('WalletFacade.init failed:', e.message);
  console.error('  Common causes: proof server not running on 6300, network unreachable, seed format issue.');
  process.exit(1);
}

// Wait for sync — give the wallet a few seconds to settle; the
// indexer status doesn't need to be 'ready' to extract the address,
// which is derivable purely from the seed.
console.log(`[wallet-info] waiting for wallet sync (indexer state)...`);
await new Promise((r) => setTimeout(r, 4000));

// The unshielded bech32 address is derived purely from the seed (via the
// unshielded keystore), so we don't actually need to wait for full sync
// to display it. We get it from the keystore directly.
const unshieldedAddr = unshieldedKeystore.getBech32Address().toString();
let state;
try {
  state = await Rx.firstValueFrom(wallet.state());
} catch {}

const coinPub = state?.shielded?.state?.coinPublicKey?.toHex?.()
  ?? state?.shielded?.coinPublicKey?.toHex?.()
  ?? '(available after first sync)';
const encPub = state?.shielded?.state?.encryptionPublicKey?.toHex?.()
  ?? state?.shielded?.encryptionPublicKey?.toHex?.()
  ?? '(available after first sync)';

console.log(`\n╔════════════════════════════════════════════════════════════╗`);
console.log(`║     UNSHIELDED ADDRESS — paste this into the preprod       ║`);
console.log(`║     faucet to receive tNight dust (then run deploy)        ║`);
console.log(`╚════════════════════════════════════════════════════════════╝`);
console.log(`  ${unshieldedAddr}\n`);

console.log(`  shielded coin pubkey:    ${coinPub}`);
console.log(`  shielded encryption key: ${encPub}`);

console.log(`\n  preprod faucet: ${config.faucet}`);
console.log(`  once funded, run:`);
console.log(`    MIDNIGHT_NETWORK=preprod npx tsx src/deploy.ts`);

// 4. Save the seed to .env (only if --fresh)
if (!useEnv) {
  const envPath = resolve(projectRoot, '.env');
  let cur = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  if (/^WALLET_SEED=/m.test(cur)) {
    cur = cur.replace(/^WALLET_SEED=.*$/m, `WALLET_SEED=${seed}`);
  } else {
    cur = cur.trimEnd() + `\nWALLET_SEED=${seed}\n`;
  }
  writeFileSync(envPath, cur, 'utf8');
  console.log(`\n[wallet-info] wrote fresh hex seed to .env (overwrote the BIP-39 mnemonic)`);
  console.log(`[wallet-info] if you need the BIP-39 mnemonic back, restore it from a backup.`);
}

wallet.close?.();
process.exit(0);
