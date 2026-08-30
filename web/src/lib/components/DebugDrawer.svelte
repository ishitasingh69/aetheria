<script lang="ts">
  // web/src/lib/components/DebugDrawer.svelte
  // Global Midnight debug drawer. Mounted in +layout.svelte. Surfaces
  // wallet, last tx, circuit call log, proof-server health, network, errors.
  // This is the "prove you are a good Midnight dev" surface — never abstract
  // these internals away from the user.
  import { onMount, onDestroy } from 'svelte';
  import { wallet, lastTx, circuitLog, proofServer, errors, logError } from '../stores/midnight';

  let open = $state(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function ping() {
    try {
      const r = await fetch($proofServer.url + '/health');
      proofServer.set({ ...$proofServer, status: r.ok ? 'ok' : 'down' });
    } catch {
      proofServer.set({ ...$proofServer, status: 'down' });
    }
  }
  onMount(() => { ping(); timer = setInterval(ping, 10_000); });
  onDestroy(() => { if (timer) clearInterval(timer); });

  function fmt(ts?: number) { return ts ? new Date(ts).toLocaleTimeString() : '—'; }
  function short(s?: string, n = 14) { return s ? (s.length > n ? s.slice(0, n) + '…' : s) : '—'; }
</script>

<button class="toggle" class:open onclick={() => (open = !open)} aria-label="Toggle Midnight debug drawer">
  {open ? '×' : '🌑'} mid
</button>

{#if open}
  <aside class="drawer" role="complementary" aria-label="Midnight debug">
    <header>
      <strong>Midnight · debug</strong>
      <span class="net">{$proofServer.url}</span>
    </header>

    <section>
      <h4>wallet</h4>
      <dl>
        <dt>connected</dt><dd>{$wallet.connected ? 'yes' : 'no'}</dd>
        <dt>address</dt><dd class="mono">{short($wallet.address, 20)}</dd>
        <dt>network</dt><dd>{$wallet.network ?? '—'}</dd>
        {#if $wallet.balance}<dt>balance</dt><dd class="mono">{$wallet.balance}</dd>{/if}
      </dl>
    </section>

    <section>
      <h4>last tx</h4>
      {#if $lastTx}
        <dl>
          {#if $lastTx.hash}<dt>hash</dt><dd class="mono">{short($lastTx.hash, 18)}</dd>{/if}
          {#if $lastTx.circuit}<dt>circuit</dt><dd class="mono">{$lastTx.circuit}</dd>{/if}
          {#if $lastTx.status}<dt>status</dt><dd class={$lastTx.status}>{$lastTx.status}</dd>{/if}
          {#if $lastTx.ts}<dt>at</dt><dd>{fmt($lastTx.ts)}</dd>{/if}
        </dl>
      {:else}
        <p class="muted">none yet — call a circuit from /app to see it here</p>
      {/if}
    </section>

    <section>
      <h4>circuit call log</h4>
      {#if $circuitLog.length === 0}
        <p class="muted">no calls</p>
      {:else}
        <ol class="log">
          {#each $circuitLog as c}
            <li>
              <span class="mono">{c.circuit}</span>
              <span class={c.ok ? 'ok' : 'fail'}>{c.ok ? '✓' : '✗'}</span>
              <span class="muted">{fmt(c.ts)}{c.ms ? ` · ${c.ms}ms` : ''}</span>
              {#if c.note}<span class="muted">— {c.note}</span>{/if}
            </li>
          {/each}
        </ol>
      {/if}
    </section>

    <section>
      <h4>proof server</h4>
      <p class="mono">{$proofServer.url}</p>
      <p>status: <span class={$proofServer.status}>{$proofServer.status}</span></p>
    </section>

    {#if $errors.length}
      <section>
        <h4>recent errors</h4>
        <ol class="log">
          {#each $errors as e}
            <li>
              <span class="mono">{e.where}</span>
              <span class="fail">{e.msg}</span>
              <span class="muted">{fmt(e.ts)}</span>
            </li>
          {/each}
        </ol>
      </section>
    {/if}
  </aside>
{/if}

<style>
  .toggle {
    position: fixed; right: 1rem; bottom: 1rem; z-index: 60;
    border: 2px solid var(--primary); background: var(--paper); color: var(--primary);
    font-family: ui-monospace, monospace; font-size: 0.75rem;
    padding: 0.45rem 0.7rem; cursor: pointer; letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .toggle.open { background: var(--primary); color: var(--paper); }
  .drawer {
    position: fixed; right: 1rem; bottom: 3rem; z-index: 55;
    width: min(28rem, calc(100vw - 2rem));
    max-height: 70vh; overflow: auto;
    background: var(--ink); color: var(--paper);
    border: 2px solid var(--primary);
    font-family: ui-monospace, monospace; font-size: 0.78rem;
    padding: 0.75rem 1rem;
  }
  header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
  .net { color: var(--secondary); font-size: 0.7rem; }
  h4 { margin: 0.75rem 0 0.25rem; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.7rem; color: var(--secondary); }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.15rem 0.6rem; margin: 0; }
  dt { color: var(--secondary); }
  dd { margin: 0; }
  .mono { font-family: ui-monospace, monospace; }
  .muted { color: var(--secondary); opacity: 0.7; }
  .ok { color: var(--secondary); }
  .fail { color: var(--primary); }
  .log { list-style: none; padding: 0; margin: 0; }
  .log li { display: flex; gap: 0.5rem; align-items: baseline; padding: 0.15rem 0; border-top: 1px solid var(--paper); }
  .log li:first-child { border-top: none; }
</style>
