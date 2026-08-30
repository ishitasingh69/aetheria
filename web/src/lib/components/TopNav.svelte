<script lang="ts">
  // web/src/lib/components/TopNav.svelte
  // Top navigation shared across all routes. Style follows the active
  // personality (consumed via CSS variables on :root).
  import { page } from '$app/stores';
  const links = [
    { href: '/', label: 'Home' },
    { href: '/app', label: 'App' },
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
    { href: '/docs', label: 'Docs' },
  ];
  $: current = $page.url.pathname;
  function isActive(href: string): boolean {
    if (href === '/') return current === '/';
    return current === href || current.startsWith(href + '/');
  }
</script>

<nav>
  <a href="/" class="brand">AETHERIA</a>
  <div class="links">
    {#each links as l}
      <a href={l.href} class:active={isActive(l.href)}>{l.label}</a>
    {/each}
  </div>
  <div class="badge">midnight · undeployed</div>
</nav>

<style>
  nav {
    display: flex; align-items: center; gap: 1.5rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 2px solid var(--primary);
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font);
  }
  .brand {
    font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--primary); text-decoration: none; font-size: 0.95rem;
  }
  .links { display: flex; gap: 1rem; flex: 1; }
  .links a {
    color: var(--ink); text-decoration: none; text-transform: uppercase;
    letter-spacing: 0.12em; font-size: 0.75rem; padding: 0.25rem 0.5rem;
    border: 1px solid transparent;
  }
  .links a.active {
    color: var(--paper); background: var(--primary); border-color: var(--primary);
  }
  .badge {
    font-family: ui-monospace, monospace; font-size: 0.7rem;
    color: var(--secondary); border: 1px solid var(--secondary);
    padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.1em;
  }
</style>
