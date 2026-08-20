<script lang="ts">
  import { solvency } from '../stores/aetheria';

  let expanded = $state(false);

  let railState = $derived($solvency.solvencyOk ? 'solvent' : 'withdraw-only');
  let label = $derived(
    $solvency.solvencyOk
      ? `SOLVENT ▸ proven at epoch ${$solvency.solvencyEpoch} ▸ ratio ≥ ${(
          $solvency.requiredRatioBps / 100
        ).toFixed(2)}%`
      : `WITHDRAW-ONLY ▸ last proven epoch ${$solvency.solvencyEpoch}`,
  );
</script>

<div class="solvency-rail" data-state={railState} role="button" tabindex="0" onclick={() => (expanded = !expanded)} onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}>
  <span>{label}</span>
  <span class="rail-sep">▸</span>
  <span class="tabular">orders committed: {$solvency.orderCount}</span>
</div>

{#if expanded}
  <div class="panel rail-history">
    <p class="muted">proof history</p>
    <div class="mono-grid">
      <div>epoch {$solvency.solvencyEpoch} — solvent: {$solvency.solvencyOk ? 'yes' : 'no'} — required ratio: {($solvency.requiredRatioBps / 100).toFixed(2)}%</div>
    </div>
  </div>
{/if}

<style>
  .rail-history {
    border-top: none;
    border-radius: 0 0 var(--radius) var(--radius);
    font-size: 12px;
  }
</style>
