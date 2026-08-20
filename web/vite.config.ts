import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const midnightRoot = path.resolve(__dirname, 'node_modules/@midnight-ntwrk');
const midnightPackages = fs.existsSync(midnightRoot) ? fs.readdirSync(midnightRoot) : [];

/** Pin leaf packages to web/node_modules (avoids ../node_modules duplicates from @api imports). */
const midnightAliases = Object.fromEntries(
  midnightPackages
    .filter((pkg) => pkg !== 'midnight-js-protocol' && pkg !== 'ledger-v8')
    .map((pkg) => [`@midnight-ntwrk/${pkg}`, path.join(midnightRoot, pkg)]),
);

const devPort = Number(process.env.PORT) || 5173;

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  plugins: [wasm(), topLevelAwait(), sveltekit()],
  resolve: {
    alias: {
      '@contract': path.resolve(__dirname, '../contract'),
      '@api': path.resolve(__dirname, '../api/src'),
      buffer: 'buffer/',
      ...midnightAliases,
    },
    dedupe: midnightPackages.map((pkg) => `@midnight-ntwrk/${pkg}`),
    extensions: ['.mjs', '.js', '.ts', '.svelte', '.json', '.wasm'],
    mainFields: ['browser', 'module', 'main'],
    conditions: ['browser', 'module', 'import', 'default'],
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
      extensions: ['.js', '.cjs'],
      ignoreDynamicRequires: true,
    },
  },
  server: {
    port: devPort,
    strictPort: true,
    host: '127.0.0.1',
    fs: { allow: ['..'] },
  },
  optimizeDeps: {
    include: [
      'buffer',
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/ledger-v8',
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/midnight-js-http-client-proof-provider',
    ],
    esbuildOptions: {
      target: 'esnext',
      supported: { 'top-level-await': true },
      platform: 'browser',
      format: 'esm',
      define: { global: 'globalThis' },
      loader: { '.wasm': 'binary' },
    },
  },
});
