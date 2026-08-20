import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { browser } from '$app/environment';

/**
 * Public app config — safe to commit (no secrets).
 * Update contractAddress after a real `yarn deploy:*` run; see deployment.json
 * at the repo root once one exists.
 */
export const APP_CONFIG = {
  networkId: 'undeployed' as const,
  contractAddress: '' as string,
  indexer: 'http://127.0.0.1:8088/api/v4/graphql',
  indexerWS: 'ws://127.0.0.1:8088/api/v4/graphql/ws',
  zkAssetPath: '/zk/aetheria',
} as const;

if (browser) {
  setNetworkId(APP_CONFIG.networkId as NetworkId);
}

export const NETWORK_ID = APP_CONFIG.networkId;
export const CONTRACT_ADDRESS = APP_CONFIG.contractAddress;
export const INDEXER_URL = APP_CONFIG.indexer;
export const ZK_ASSET_PATH = APP_CONFIG.zkAssetPath;
export const ZK_ASSET_ORIGIN =
  browser ? new URL(ZK_ASSET_PATH, window.location.origin).toString() : ZK_ASSET_PATH;
