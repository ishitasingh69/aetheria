<script lang="ts">
  // web/src/routes/settings/+page.svelte
  // User preferences. Mostly read/write of the local midnight state.
  import { wallet, proofServer } from '../../lib/stores/midnight';

  let network = $state<'undeployed' | 'preview' | 'preprod'>('undeployed');
  let serverUrl = $state('http://127.0.0.1:6300');
  let logLevel = $state<'info' | 'warn' | 'error'>('warn');

  function save() {
    wallet.update((w) => ({ ...w, network }));
    proofServer.update((p) => ({ ...p, url: serverUrl }));
    // Persist to localStorage so the next session picks it up.
    try {
      localStorage.setItem('aetheria.settings', JSON.stringify({ network, serverUrl, logLevel }));
    } catch {}
  }
  $effect(() => {
    try {
      const raw = localStorage.getItem('aetheria.settings');
      if (raw) {
        const s = JSON.parse(raw);
        network = s.network; serverUrl = s.serverUrl; logLevel = s.logLevel;
      }
    } catch {}
  });
</script>

<svelte:head><title>Settings · Aetheria</title></svelte:head>

<section class="page">
  <h1>Settings</h1>
  <p class="muted">These are local preferences. The wallet seed is never stored in this app — it lives in your browser wallet (Lace).</p>

  <form onsubmit={(e) => { e.preventDefault(); save(); }}>
    <label>
      <span>Network</span>
      <select bind:value={network}>
        <option value="undeployed">undeployed (local docker)</option>
        <option value="preview">preview (testnet)</option>
        <option value="preprod">preprod (testnet)</option>
      </select>
    </label>

    <label>
      <span>Proof server URL</span>
      <input type="url" bind:value={serverUrl} />
    </label>

    <label>
      <span>Log level</span>
      <select bind:value={logLevel}>
        <option value="info">info</option>
        <option value="warn">warn</option>
        <option value="error">error</option>
      </select>
    </label>

    <button type="submit">Save</button>
  </form>

  <p class="muted small">Saved settings are kept in <code>localStorage</code> under <code>aetheria.settings</code>. Clear your browser storage to reset.</p>
</section>

<style>
  .page { padding: 2rem 1.5rem; max-width: 40rem; margin: 0 auto; }
  h1 { font-family: var(--font); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.5rem; }
  .muted { color: var(--secondary); opacity: 0.8; }
  form { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
  label { display: flex; flex-direction: column; gap: 0.3rem; font-family: ui-monospace, monospace; font-size: 0.85rem; }
  label span { color: var(--primary); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.7rem; }
  select, input {
    background: var(--paper); color: var(--ink);
    border: 2px solid var(--primary); padding: 0.5rem;
    font-family: ui-monospace, monospace;
  }
  button {
    background: var(--primary); color: var(--paper);
    border: 2px solid var(--primary); padding: 0.6rem 1rem;
    font-family: var(--font); text-transform: uppercase; letter-spacing: 0.12em;
    cursor: pointer; align-self: flex-start;
  }
  .small { font-size: 0.75rem; margin-top: 1.5rem; }
  code { background: var(--ink); color: var(--paper); padding: 0.1rem 0.3rem; }
</style>
