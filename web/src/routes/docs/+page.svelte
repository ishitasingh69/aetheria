<script lang="ts">
  // web/src/routes/docs/+page.svelte
  // User + developer documentation. Privacy model, circuit reference, FAQ.
</script>

<svelte:head><title>Docs · Aetheria</title></svelte:head>

<section class="page">
  <h1>Docs</h1>

  <article>
    <h2>Privacy model</h2>
    <p>Aetheria is a dark pool + credit market. Privacy is the product — every other part of the system is engineered to keep it that way.</p>
    <div class="split">
      <div>
        <h3>Observer can see</h3>
        <ul>
          <li>aggregate collateral, aggregate debt, utilisation rate</li>
          <li>whether a rolling proof of solvency has been produced for the current epoch</li>
          <li>that a position exists, but not its contents</li>
          <li>that a fill happened between two commitments, but not the contents of either</li>
          <li>auction id, clearing epoch, and outcome flag of any liquidation</li>
        </ul>
      </div>
      <div>
        <h3>Observer cannot see</h3>
        <ul>
          <li>order side, price, size, or owner of a resting order</li>
          <li>counterparty of any fill</li>
          <li>collateral ratio, debt size, or liquidation threshold of any position</li>
          <li>the bid vector or winning bid of a sealed-bid liquidation</li>
          <li>any single position's contribution to the solvency proof</li>
        </ul>
      </div>
    </div>
  </article>

  <article>
    <h2>Circuits</h2>
    <dl>
      <dt><code>placeOrder(commitment, nullifier)</code></dt>
      <dd>Maker commits an order. Side, price, size, and expiry are in the witness. Ledger records the commitment; the order itself is private state.</dd>
      <dt><code>proveSolvency(epoch)</code></dt>
      <dd>Anyone can run a proof that aggregate collateral ≥ aggregate debt × required ratio at epoch N, without opening any position.</dd>
    </dl>
  </article>

  <article>
    <h2>Setup</h2>
    <ol>
      <li>Install toolchain: <code>compact</code>, Docker, Node 22.</li>
      <li>Run <code>node .claude/skills/midnight-level-pack/scripts/midnight-up.mjs --project .</code> to bring up node + indexer + proof-server.</li>
      <li>Compile the contract: <code>cd contract &amp;&amp; compact compile +0.31.1 aetheria.compact managed/aetheria</code>.</li>
      <li>Deploy: <code>yarn deploy:undeployed</code>. This writes <code>deployment.json</code>.</li>
      <li>Run the web: <code>yarn web:dev</code> → <code>http://localhost:5173</code>.</li>
    </ol>
  </article>

  <article>
    <h2>FAQ</h2>
    <details><summary>Why is there no "public order book"?</summary><p>Because the moment an order is on a public book it becomes a free option written to the mempool. The whole point of Aetheria is that order intent never leaks.</p></details>
    <details><summary>How is solvency proven without opening positions?</summary><p>The contract maintains aggregate roots (Pedersen-style) over the shielded position set. <code>proveSolvency</code> shows that the commitments in those roots collectively satisfy the ratio constraint — a ZK proof, not a balance sheet.</p></details>
    <details><summary>What cardinality and timing leak?</summary><p>Cardinality (how many positions exist) and timing (when a fill or proof happens) cannot be hidden by ZK; the contract mitigates this by batching and decoy activity. See <code>docs/protocol.md</code> in the repo for the full analysis.</p></details>
  </article>
</section>

<style>
  .page { padding: 2rem 1.5rem; max-width: 56rem; margin: 0 auto; }
  h1 { font-family: var(--font); text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 1.5rem; }
  article { border: 2px solid var(--primary); padding: 1.25rem; margin-bottom: 1.5rem; background: var(--paper); }
  article h2 { margin: 0 0 0.75rem; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--primary); }
  article h3 { margin: 0 0 0.4rem; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--secondary); }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  ul { padding-left: 1.2rem; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.4rem 1rem; font-family: ui-monospace, monospace; font-size: 0.8rem; }
  dt { color: var(--primary); }
  code { font-family: ui-monospace, monospace; background: var(--ink); color: var(--paper); padding: 0.05rem 0.3rem; }
  details { padding: 0.3rem 0; border-top: 1px solid var(--primary); }
  details:first-of-type { border-top: none; }
  summary { cursor: pointer; color: var(--primary); }
  @media (max-width: 768px) { .split { grid-template-columns: 1fr; } }
</style>
