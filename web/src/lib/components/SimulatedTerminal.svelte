<script lang="ts">
  type Side = 'buy' | 'sell';
  type Stage = 'idle' | 'witness' | 'constraints' | 'proof' | 'submit' | 'done';

  let side = $state<Side>('buy');
  let size = $state('10');
  let limit = $state('42.50');
  let expiry = $state('1h');
  let stage = $state<Stage>('idle');
  let blotter = $state<{ side: Side; size: string; limit: string; state: string }[]>([]);
  let mockEpoch = $state(4);
  let mockSolvent = $state(true);

  const STAGES: Stage[] = ['witness', 'constraints', 'proof', 'submit'];

  async function commit() {
    if (stage !== 'idle' && stage !== 'done') return;
    const entryIndex = blotter.length;
    blotter = [{ side, size, limit, state: 'proving' }, ...blotter];
    for (const s of STAGES) {
      stage = s;
      await new Promise((r) => setTimeout(r, 260));
    }
    stage = 'done';
    blotter = blotter.map((b, i) => (i === 0 ? { ...b, state: 'committed' } : b));
    mockEpoch += 1;
    setTimeout(() => (stage = 'idle'), 400);
  }

  function toggle(s: Side) {
    side = s;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'b') toggle('buy');
    if (e.key === 's') toggle('sell');
    if (e.key === 'Enter') void commit();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div class="sim panel">
  <div class="sim-rail" data-state={mockSolvent ? 'solvent' : 'withdraw-only'}>
    SOLVENT ▸ proven {mockEpoch} epochs ago ▸ ratio ≥ 150% ▸ simulated — no wallet, no wire
  </div>

  <div class="sim-entry">
    <div class="side-toggle">
      <button class:active={side === 'buy'} onclick={() => toggle('buy')}>[b]uy</button>
      <button class:active={side === 'sell'} onclick={() => toggle('sell')}>[s]ell</button>
    </div>
    <label>size <input class="tabular" bind:value={size} /></label>
    <label>limit <input class="tabular" bind:value={limit} /></label>
    <label>
      expiry
      <select bind:value={expiry}>
        <option>15m</option>
        <option>1h</option>
        <option>1d</option>
      </select>
    </label>
    <button class="primary" onclick={commit} disabled={stage !== 'idle' && stage !== 'done'}>⏎ commit</button>
  </div>

  <p class="disclosure muted">
    publishes: 1 commitment. reveals: nothing. cost: ~30k constraints, ~1s.
  </p>

  {#if stage !== 'idle'}
    <div class="pipeline">
      {#each STAGES as s}
        <div class="pipe-seg" class:filled={STAGES.indexOf(s) <= STAGES.indexOf(stage === 'done' ? 'submit' : stage)}>
          {s}
        </div>
      {/each}
    </div>
  {/if}

  <div class="sim-blotter mono-grid">
    {#each blotter as row}
      <div class={row.side === 'buy' ? 'bid' : 'ask'}>
        {row.side === 'buy' ? '+' : '−'} {row.size} @ {row.limit} — {row.state}
      </div>
    {/each}
    {#if blotter.length === 0}
      <div class="muted">no orders yet — press enter to simulate one</div>
    {/if}
  </div>
</div>

<style>
  .sim {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 4);
  }
  .sim-rail {
    font-size: 12px;
    padding: calc(var(--unit) * 2);
    border: 1px solid var(--hairline);
    border-radius: var(--radius);
  }
  .sim-rail[data-state='solvent'] {
    border-color: var(--bid);
    color: var(--bid);
  }
  .sim-entry {
    display: flex;
    flex-wrap: wrap;
    gap: calc(var(--unit) * 3);
    align-items: end;
  }
  .side-toggle {
    display: flex;
    gap: calc(var(--unit) * 2);
  }
  .side-toggle button.active {
    border-color: var(--accent);
    color: var(--accent);
  }
  label {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 1);
    font-size: 12px;
    color: var(--ink-muted);
  }
  input,
  select {
    width: 100px;
  }
  .disclosure {
    font-size: 12px;
    margin: 0;
  }
  .pipeline {
    display: flex;
    gap: 1px;
  }
  .pipe-seg {
    flex: 1;
    text-align: center;
    padding: calc(var(--unit) * 1.5);
    font-size: 11px;
    background: var(--bg);
    border: 1px solid var(--hairline);
    color: var(--ink-muted);
    transition: background var(--motion), color var(--motion);
  }
  .pipe-seg.filled {
    background: var(--accent);
    color: #07090c;
    border-color: var(--accent);
  }
  .sim-blotter {
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 1);
    min-height: 60px;
  }
</style>
