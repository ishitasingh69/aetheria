<script lang="ts">
  // web/src/routes/+layout.svelte
  // Mounts the global personality (CSS variables), top nav, and debug drawer.
  // The Midnight-style scanline / glow overlays follow the neon-cyber personality.
  import '../lib/styles/global.css';
  import { onMount } from 'svelte';
  import TopNav from '../lib/components/TopNav.svelte';
  import DebugDrawer from '../lib/components/DebugDrawer.svelte';
  import personality from '../lib/personality.json';
  import SolvencyRail from '../lib/components/SolvencyRail.svelte';
  import { startPolling } from '../lib/stores/aetheria';

  let { children } = $props();

  onMount(() => {
    const stop = startPolling();
    return stop;
  });
</script>

<div
  class="shell"
  style="--primary: {personality.primary}; --secondary: {personality.secondary}; --ink: {personality.ink}; --paper: {personality.paper}; --accent: {personality.accent}; --font: {personality.font};"
>
  <TopNav />
  <SolvencyRail />
  <main>
    {@render children?.()}
  </main>
  <DebugDrawer />
</div>

<style>
  .shell { min-height: 100vh; display: flex; flex-direction: column; }
  main { flex: 1; min-height: 0; }
</style>
