<script lang="ts">
  import WalletBar from '../../lib/components/WalletBar.svelte';
  import {
    connection,
    solvency,
    busy,
    lastTxLog,
    submitPlaceOrder,
    submitProveSolvency,
    randomOrderCommit,
  } from '../../lib/stores/aetheria';
  import { CONTRACT_ADDRESS } from '../../lib/midnight/config';

  let collateral = $state('150');
  let debt = $state('100');
  let orderStatus = $state<string | null>(null);
  let solvencyStatus = $state<string | null>(null);

  async function onPlaceOrder() {
    orderStatus = 'proving…';
    try {
      const commit = randomOrderCommit();
      await submitPlaceOrder(commit);
      orderStatus = `committed ${commit.slice(0, 10)}…`;
    } catch (e) {
      orderStatus = e instanceof Error ? e.message : String(e);
    }
  }

  async function onProveSolvency() {
    solvencyStatus = 'proving…';
    try {
      await submitProveSolvency(BigInt(collateral || '0'), BigInt(debt || '0'));
      solvencyStatus = 'solvency proven';
    } catch (e) {
      solvencyStatus = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<svelte:head>
  <title>aetheria · terminal</title>
</svelte:head>

<div class="terminal">
  <div class="term-top">
    <a href="/" class="muted">← aetheria</a>
    <WalletBar />
  </div>

  {#if !CONTRACT_ADDRESS}
    <div class="panel warn">
      no contract address configured yet. this terminal will render but every
      submit will fail until <code>web/src/lib/midnight/config.ts</code>
      points at a real deployment (see repo root <code>deployment.json</code>
      after <code>yarn deploy:*</code>).
    </div>
  {/if}

  <div class="grid">
    <section class="panel">
      <h2>order entry</h2>
      <p class="muted">publishes: 1 commitment. reveals: nothing. cost: ~30k constraints.</p>
      <button class="primary" onclick={onPlaceOrder} disabled={$busy || !$connection.connected}>
        commit random order
      </button>
      {#if orderStatus}<p class="tabular status">{orderStatus}</p>{/if}
    </section>

    <section class="panel">
      <h2>solvency proof</h2>
      <p class="muted">
        witness-held collateral / debt never leave this form. only pass/fail
        and an epoch counter reach the ledger.
      </p>
      <label>
        collateral <input class="tabular" bind:value={collateral} />
      </label>
      <label>
        debt <input class="tabular" bind:value={debt} />
      </label>
      <button class="primary" onclick={onProveSolvency} disabled={$busy || !$connection.connected}>
        prove solvency
      </button>
      {#if solvencyStatus}<p class="tabular status">{solvencyStatus}</p>{/if}
    </section>

    <section class="panel risk">
      <h2>risk (yours vs. the market's)</h2>
      <div class="risk-cols mono-grid">
        <div>
          <p class="muted">private (you)</p>
          <div>collateral: <span class="tabular">{collateral}</span> <span class="accent">🔒</span></div>
          <div>debt: <span class="tabular">{debt}</span> <span class="accent">🔒</span></div>
        </div>
        <div>
          <p class="muted">public (everyone)</p>
          <div>—</div>
          <div>—</div>
        </div>
      </div>
    </section>

    <section class="panel log">
      <h2>activity</h2>
      <div class="mono-grid">
        {#each $lastTxLog as line}
          <div class="muted">{line}</div>
        {/each}
        {#if $lastTxLog.length === 0}
          <div class="muted">nothing yet</div>
        {/if}
      </div>
    </section>
  </div>

  <p class="muted footer-note tabular">
    orders committed on-chain: {$solvency.orderCount} · required ratio:
    {($solvency.requiredRatioBps / 100).toFixed(2)}% · solvent:
    {$solvency.solvencyOk ? 'yes' : 'no'} · epoch {$solvency.solvencyEpoch}
  </p>
</div>

<style>
  .terminal {
    max-width: 1080px;
    margin: 0 auto;
    padding: calc(var(--unit) * 6) calc(var(--unit) * 5);
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 5);
  }
  .term-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .warn {
    border-color: var(--accent);
    color: var(--accent);
    font-size: 12px;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: calc(var(--unit) * 4);
  }
  .grid section {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 3);
    align-items: start;
  }
  h2 {
    font-size: 13px;
    text-transform: lowercase;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 1);
    font-size: 12px;
    color: var(--ink-muted);
    width: 100%;
  }
  input {
    width: 100%;
  }
  .status {
    margin: 0;
    font-size: 12px;
  }
  .risk-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: calc(var(--unit) * 4);
    width: 100%;
  }
  .log {
    max-height: 220px;
    overflow-y: auto;
  }
  .footer-note {
    font-size: 12px;
    border-top: 1px solid var(--hairline);
    padding-top: calc(var(--unit) * 3);
  }
  @media (max-width: 720px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
