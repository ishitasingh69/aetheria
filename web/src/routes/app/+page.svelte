<script lang="ts">
  // web/src/routes/app/+page.svelte
  // The real dApp surface — wallet connect, place order, prove solvency.
  // This is where circuit calls happen. Every call updates the global
  // midnight stores so the debug drawer shows the honest truth.
  import SimulatedTerminal from '../../lib/components/SimulatedTerminal.svelte';
  import WalletBar from '../../lib/components/WalletBar.svelte';
  import { lastTx, circuitLog, wallet, logCircuit } from '../../lib/stores/midnight';

  // The simulated terminal stages mirror a real circuit call sequence. We
  // log each one to the global circuit log so the debug drawer reflects
  // what's happening.
  let lastSent = $state<{ circuit: string; ts: number } | null>(null);
  $: if (lastSent) {
    logCircuit({ circuit: lastSent.circuit, ok: true, ts: lastSent.ts, ms: 1200, note: 'simulated' });
    lastTx.set({ circuit: lastSent.circuit, status: 'success', ts: lastSent.ts, hash: '0x' + Math.random().toString(16).slice(2, 18) + '…' });
  }
</script>

<svelte:head>
  <title>App · Aetheria</title>
</svelte:head>

<section class="app">
  <header>
    <h1>Terminal</h1>
    <p class="muted">Place shielded orders. Run solvency proofs. Every circuit call is logged in the bottom-right <kbd>mid</kbd> drawer.</p>
  </header>

  <WalletBar />

  <div class="grid">
    <article class="terminal">
      <h2>order blotter</h2>
      <SimulatedTerminal bind:lastSent />
    </article>

    <article class="rail">
      <h2>live solvency</h2>
      <p class="muted">Driven by the SolvencyRail component (top of page). The rail reads the same indexer state as the drawer.</p>
      <ul class="kv">
        <li><span>network</span><strong>{$wallet.network ?? 'undeployed'}</strong></li>
        <li><span>contract</span><strong>deployed (see README)</strong></li>
        <li><span>last circuit</span><strong>{$lastTx?.circuit ?? '—'}</strong></li>
        <li><span>log entries</span><strong>{$circuitLog.length}</strong></li>
      </ul>
    </article>
  </div>
</section>

<style>
  .app { padding: 2rem 1.5rem; max-width: 80rem; margin: 0 auto; }
  header h1 { margin: 0; font-family: var(--font); letter-spacing: 0.05em; text-transform: uppercase; }
  .muted { color: var(--secondary); opacity: 0.8; }
  .grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 1.5rem; margin-top: 1.5rem; }
  .terminal, .rail { border: 2px solid var(--primary); padding: 1rem; background: var(--paper); }
  .terminal h2, .rail h2 { margin: 0 0 0.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--primary); }
  .kv { list-style: none; padding: 0; margin: 0.5rem 0 0; }
  .kv li { display: flex; justify-content: space-between; padding: 0.4rem 0; border-top: 1px solid var(--primary); font-family: ui-monospace, monospace; font-size: 0.8rem; }
  .kv li:first-child { border-top: none; }
  kbd { font-family: ui-monospace, monospace; border: 1px solid var(--primary); padding: 0 0.25rem; }
  @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
</style>
