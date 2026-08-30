// web/src/lib/stores/midnight.ts
//
// Global debug-drawer state. The drawer lives in +layout.svelte and reads from
// these stores. Anything in the app that calls a circuit, connects a wallet,
// or sees an error should also push to these stores so the drawer stays honest.

import { writable } from 'svelte/store';

export type WalletState = {
  connected: boolean;
  address?: string;
  network?: 'undeployed' | 'preview' | 'preprod';
  balance?: string;
};

export type TxReceipt = {
  hash?: string;
  circuit?: string;
  status?: 'pending' | 'success' | 'failed';
  ts?: number;
};

export type CircuitLogEntry = {
  circuit: string;
  ok: boolean;
  ts: number;
  ms?: number;
  note?: string;
};

export type ErrorEntry = { where: string; msg: string; ts: number };

export const wallet = writable<WalletState>({ connected: false });
export const lastTx = writable<TxReceipt | null>(null);
export const circuitLog = writable<CircuitLogEntry[]>([]);
export const errors = writable<ErrorEntry[]>([]);

// Proof-server URL is the only network call the drawer makes itself.
export const proofServer = writable<{ url: string; status: 'unknown' | 'ok' | 'down' }>({
  url: 'http://127.0.0.1:6300',
  status: 'unknown',
});

export function logCircuit(entry: CircuitLogEntry) {
  circuitLog.update((l) => [entry, ...l].slice(0, 50));
}
export function logError(where: string, msg: string) {
  errors.update((l) => [{ where, msg, ts: Date.now() }, ...l].slice(0, 30));
}
