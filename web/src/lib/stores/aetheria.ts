import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import pino from 'pino';
import { AetheriaAPI, type SolvencyState } from '@api/index.js';
import { BrowserAetheriaManager, friendlyError, getOrCreateSecrets, saveSecrets } from '../midnight/manager';
import { CONTRACT_ADDRESS, INDEXER_URL, NETWORK_ID } from '../midnight/config';

export type ConnectionState = {
  connected: boolean;
  connecting: boolean;
  unshieldedAddress: string | null;
  error: string | null;
};

export const connection = writable<ConnectionState>({
  connected: false,
  connecting: false,
  unshieldedAddress: null,
  error: null,
});

export const solvency = writable<SolvencyState>({
  orderCount: 0,
  requiredRatioBps: 0,
  solvencyOk: true,
  solvencyEpoch: 0,
});

export const busy = writable(false);
export const lastTxLog = writable<string[]>([]);

function log(line: string) {
  lastTxLog.update((lines) => [line, ...lines].slice(0, 20));
}

let manager: BrowserAetheriaManager | null = null;
function getManager(): BrowserAetheriaManager {
  if (!manager) {
    const logger = pino({ level: 'warn', browser: { asObject: true } });
    manager = new BrowserAetheriaManager(logger);
  }
  return manager;
}

export async function refreshSolvency(): Promise<void> {
  if (!CONTRACT_ADDRESS) return;
  try {
    const state = await AetheriaAPI.fetchSolvencyState(INDEXER_URL, CONTRACT_ADDRESS, NETWORK_ID as any);
    solvency.set(state);
  } catch {
    // quiet — solvency rail keeps its last known value on a poll miss
  }
}

let pollHandle: ReturnType<typeof setInterval> | undefined;
export function startPolling(intervalMs = 15_000): () => void {
  if (!browser) return () => {};
  void refreshSolvency();
  pollHandle = setInterval(() => void refreshSolvency(), intervalMs);
  return () => pollHandle && clearInterval(pollHandle);
}

export async function connectWallet(): Promise<void> {
  connection.update((s) => ({ ...s, connecting: true, error: null }));
  try {
    const mgr = getManager();
    const session = await mgr.getSession();
    if (CONTRACT_ADDRESS) {
      await mgr.join(CONTRACT_ADDRESS);
    }
    connection.set({
      connected: true,
      connecting: false,
      unshieldedAddress: session.unshieldedAddress,
      error: null,
    });
    log('wallet connected');
  } catch (e) {
    const message = friendlyError(e);
    connection.set({ connected: false, connecting: false, unshieldedAddress: null, error: message });
    throw new Error(message);
  }
}

export async function disconnectWallet(): Promise<void> {
  try {
    await getManager().disconnect();
  } catch {
    // wallet may already be disconnected
  }
  connection.set({ connected: false, connecting: false, unshieldedAddress: null, error: null });
}

/** Submit an order commitment. hex is 64 lowercase hex chars, no 0x. */
export async function submitPlaceOrder(commitHex: string): Promise<void> {
  if (!CONTRACT_ADDRESS) throw new Error('No contract deployed yet — see README status section.');
  busy.set(true);
  try {
    const api = await getManager().join(CONTRACT_ADDRESS);
    await api.placeOrder(commitHex);
    log(`placeOrder ${commitHex.slice(0, 10)}…`);
    await refreshSolvency();
  } catch (e) {
    throw new Error(friendlyError(e));
  } finally {
    busy.set(false);
  }
}

export async function submitProveSolvency(collateralValue: bigint, debtValue: bigint): Promise<void> {
  if (!CONTRACT_ADDRESS) throw new Error('No contract deployed yet — see README status section.');
  busy.set(true);
  try {
    saveSecrets({ collateralValue, debtValue });
    const api = await getManager().join(CONTRACT_ADDRESS);
    await api.proveSolvency();
    log(`proveSolvency (${collateralValue} ≥ ${debtValue} × ratio)`);
    await refreshSolvency();
  } catch (e) {
    throw new Error(friendlyError(e));
  } finally {
    busy.set(false);
  }
}

export const witnessValues = derived([], () => (browser ? getOrCreateSecrets() : { collateralValue: 0n, debtValue: 0n }));

export function randomOrderCommit(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
