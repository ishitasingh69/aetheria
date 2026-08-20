<script lang="ts">
  import '../lib/styles/global.css';
  import { onMount } from 'svelte';
  import SolvencyRail from '../lib/components/SolvencyRail.svelte';
  import { startPolling } from '../lib/stores/aetheria';

  let { children } = $props();

  onMount(() => {
    const stop = startPolling();
    return stop;
  });
</script>

<SolvencyRail />
<main>
  {@render children()}
</main>

<style>
  main {
    min-height: calc(100vh - 32px);
  }
</style>
