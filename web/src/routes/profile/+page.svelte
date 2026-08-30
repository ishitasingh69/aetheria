<script lang="ts">
  // web/src/routes/profile/+page.svelte
  // Wallet + user view. Reads from the global wallet store.
  import { wallet, circuitLog } from '../../lib/stores/midnight';
</script>

<svelte:head><title>Profile · Aetheria</title></svelte:head>

<section class="page">
  <h1>Profile</h1>
  <p class="muted">Wallet, identity, and history are kept on this device. Nothing private ever leaves your browser.</p>

  <div class="card">
    <h2>Wallet</h2>
    <dl>
      <dt>connected</dt><dd>{$wallet.connected ? 'yes' : 'no'}</dd>
      <dt>address</dt><dd class="mono">{$wallet.address ?? '— connect from the App tab —'}</dd>
      <dt>network</dt><dd>{$wallet.network ?? 'undeployed'}</dd>
    </dl>
  </div>

  <div class="card">
    <h2>Activity</h2>
    {#if $circuitLog.length === 0}
      <p class="muted">No circuit calls yet. Open the <a href="/app">App</a> tab and place an order.</p>
    {:else}
      <ol class="log">
        {#each $circuitLog as c}
          <li>
            <span class="mono">{c.circuit}</span>
            <span class={c.ok ? 'ok' : 'fail'}>{c.ok ? '✓' : '✗'}</span>
            <span class="muted">{new Date(c.ts).toLocaleString()}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</section>

<style>
  .page { padding: 2rem 1.5rem; max-width: 56rem; margin: 0 auto; }
  h1 { font-family: var(--font); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.5rem; }
  .muted { color: var(--secondary); opacity: 0.8; }
  .card { border: 2px solid var(--primary); padding: 1rem; margin-top: 1.5rem; }
  .card h2 { margin: 0 0 0.5rem; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--primary); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.3rem 0.8rem; font-family: ui-monospace, monospace; font-size: 0.85rem; }
  dt { color: var(--secondary); }
  .mono { font-family: ui-monospace, monospace; }
  .log { list-style: none; padding: 0; margin: 0; font-family: ui-monospace, monospace; font-size: 0.8rem; }
  .log li { display: flex; gap: 0.6rem; padding: 0.3rem 0; border-top: 1px solid var(--primary); }
  .log li:first-child { border-top: none; }
  .ok { color: var(--secondary); }
  .fail { color: var(--primary); }
  a { color: var(--primary); }
</style>
