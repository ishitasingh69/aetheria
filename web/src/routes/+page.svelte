<script lang="ts">
  import SimulatedTerminal from '../lib/components/SimulatedTerminal.svelte';
  import WalletBar from '../lib/components/WalletBar.svelte';

  const mempoolSample = [
    { hash: '0x8f2a…c119', from: '0x71C…9e4', to: 'UniswapV3Pool', method: 'swapExactTokens', amount: '420,000 USDC → ETH', visible: true },
    { hash: '0x51bd…7a02', from: '0x9F1…22b', to: 'AaveV3Pool', method: 'liquidationCall', amount: 'collateral: 180 wstETH', visible: true },
    { hash: '0x1cee…f441', from: '0x44A…f0c', to: 'LimitOrderBook', method: 'placeLimitOrder', amount: 'bid 2.1M @ 3,412.50', visible: true },
  ];

  const stateSplit = [
    { row: 'order', private: 'side, price, size, owner', public: 'commitment, nullifier on fill' },
    { row: 'position', private: 'collateral, debt, entry, liq. price', public: 'position count, aggregate roots' },
    { row: 'fill', private: 'price, size, both counterparties', public: 'fill count, epoch volume bucket' },
    { row: 'liquidation', private: 'bid vector, winner\'s bid', public: 'auction id, clearing epoch, outcome flag' },
    { row: 'solvency', private: 'every position', public: 'solvencyOk: Boolean, provenAtEpoch: Counter' },
  ];
</script>

<svelte:head>
  <title>aetheria</title>
</svelte:head>

<div class="landing">
  <header class="hero">
    <div class="hero-top">
      <span class="wordmark accent">aetheria</span>
      <div class="hero-actions">
        <WalletBar />
        <a href="/terminal"><button>open terminal</button></a>
      </div>
    </div>
    <h1>a dark pool that can prove it isn't lying to you.</h1>
    <p>
      shielded orders, shielded positions, and a continuous on-chain proof that
      aggregate collateral covers aggregate debt — without opening a single
      position. traders get opacity. the market gets arithmetic.
    </p>
  </header>

  <section class="argument">
    <div class="arg-block">
      <h2><span class="ask">01</span> the leak</h2>
      <p>a resting bid on a transparent chain is a free option written to the
        whole mempool. here is a real sample of what that looks like:</p>
      <div class="panel mempool">
        {#each mempoolSample as tx}
          <div class="mempool-row mono-grid">
            <span class="muted">{tx.hash}</span>
            <span class="ask">{tx.method}</span>
            <span>{tx.amount}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="arg-block">
      <h2><span class="bid">02</span> the fix</h2>
      <p>every object in aetheria splits into a private witness and a public
        commitment. the ledger never sees the private half.</p>
      <div class="panel split-table">
        <div class="split-row split-head mono-grid muted">
          <span>object</span><span>private</span><span>public</span>
        </div>
        {#each stateSplit as r}
          <div class="split-row mono-grid">
            <span class="accent">{r.row}</span>
            <span class="muted">{r.private}</span>
            <span>{r.public}</span>
          </div>
        {/each}
      </div>
    </div>

    <div class="arg-block">
      <h2><span class="accent">03</span> the receipt</h2>
      <p>the solvency rail at the top of this page is real — polled from the
        deployed contract's ledger state, not a mock. a venue that stops
        proving looks exactly like a venue that cannot. that is the point.</p>
    </div>
  </section>

  <section class="sim-section">
    <h2>try it — no wallet required</h2>
    <p>the same components, the same four-stage proving pipeline, seeded with
      synthetic state. <code>b</code>/<code>s</code> to pick a side, enter to commit.</p>
    <SimulatedTerminal />
  </section>

  <footer class="landing-footer muted">
    spec complete. contract surface drafted. no audit. do not put real size
    through this. <a href="/terminal">open the real terminal →</a>
  </footer>
</div>

<style>
  .landing {
    max-width: 920px;
    margin: 0 auto;
    padding: calc(var(--unit) * 8) calc(var(--unit) * 5) calc(var(--unit) * 16);
    display: flex;
    flex-direction: column;
    gap: calc(var(--unit) * 12);
  }
  .hero-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: calc(var(--unit) * 6);
  }
  .hero-actions {
    display: flex;
    gap: calc(var(--unit) * 3);
    align-items: center;
  }
  .wordmark {
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  h1 {
    font-size: 28px;
    max-width: 20ch;
  }
  .argument {
    display: grid;
    gap: calc(var(--unit) * 8);
  }
  .arg-block h2 {
    font-size: 15px;
    text-transform: lowercase;
  }
  .mempool-row,
  .split-row {
    display: grid;
    grid-template-columns: 1fr 1.3fr 1.3fr;
    gap: calc(var(--unit) * 3);
    padding: calc(var(--unit) * 1.5) 0;
    border-bottom: 1px solid var(--hairline);
  }
  .mempool-row {
    grid-template-columns: 1fr 1.2fr 1.6fr;
  }
  .split-head {
    border-bottom: 1px solid var(--ink-muted);
    font-size: 11px;
    text-transform: uppercase;
  }
  .split-row:last-child,
  .mempool-row:last-child {
    border-bottom: none;
  }
  .sim-section h2 {
    font-size: 15px;
  }
  .landing-footer {
    font-size: 12px;
    border-top: 1px solid var(--hairline);
    padding-top: calc(var(--unit) * 4);
  }
</style>
