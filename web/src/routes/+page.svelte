<script lang="ts">
  // web/src/routes/+page.svelte
  // Landing page. Marketing surface, NOT the app. The app lives at /app.
  // Per the Midnight level-pack: hero, problem, solution, architecture,
  // privacy model, why-it-matters, CTA.
  import personality from '../lib/personality.json';

  const data = {
    name: 'Aetheria',
    oneLiner: 'A dark pool + credit market where the order book is shielded state and solvency is a rolling proof.',
    problem:
      'Three things break institutional flow on transparent chains: order leakage (a resting bid is a free option written to the mempool), liquidation cascades (public thresholds are a coordination signal that bots pile into), and the absence of a credible solvency audit (the alternative — trust an off-chain venue — has cost people real money).',
    solution:
      'Aetheria moves the order book into shielded state, runs liquidations as sealed-bid Dutch auctions with homomorphic commitments, and proves solvency every epoch over the private position set without opening a single position. Traders get opacity. The market gets arithmetic.',
    advantages: [
      'No order leakage — side, price, size, and owner are in the witness; only the commitment is public.',
      'No liquidation cascade — thresholds are private; eligibility is proven, not announced.',
      'Rolling solvency proof — aggregate collateral ≥ aggregate debt × required ratio, proven every epoch.',
      'Sealed-bid clearing — winning bid is opened only at clearing time, not before.',
      'Counterparty opacity — fills are proven between two commitments, both kept private.',
    ],
    architecture: {
      circuit: 'placeOrder, proveSolvency',
      ledger: 'aggregate roots, position count, fill count, auction id, solvencyOk, provenAtEpoch',
      witness: 'order side / price / size / owner; position collateral / debt / threshold',
      privateState: 'every order, every position, every bid, every counterparty',
      publicState: 'commitments, aggregate roots, clearing flags, solvency proof',
    },
    privacy: {
      observerSees: [
        'aggregate collateral, aggregate debt, utilisation rate',
        'whether a rolling solvency proof exists for the current epoch',
        'that a position exists, but not its contents',
        'auction id, clearing epoch, and outcome flag',
      ],
      observerCannotSee: [
        'order side, price, size, or owner',
        'counterparty of any fill',
        'any position\'s collateral ratio, debt size, or liquidation threshold',
        'the bid vector or winning bid of a sealed-bid liquidation',
      ],
    },
    significance:
      'Privacy is the product. If you can see the order book you can pick it off. If you can see thresholds you can co-ordinate against them. If you cannot audit solvency you are trusting the venue. Midnight is the only place where all three problems get solved in a single state machine. Aetheria is the first venue that takes that seriously — an institutional surface, not a public book, with proofs of solvency that do not require opening any position.',
    cta: { label: 'Open the terminal', href: '/app' },
  };
</script>

<svelte:head>
  <title>{data.name} — {data.oneLiner}</title>
  <meta name="description" content={data.significance.slice(0, 160)} />
</svelte:head>

<main class="landing" style="font-family: {personality.font};">
  <section class="hero">
    <p class="kicker">midnight network dapp · {personality.label}</p>
    <h1>{data.name}</h1>
    <p class="oneLiner">{data.oneLiner}</p>
    <a class="cta" href={data.cta.href}>{data.cta.label}</a>
  </section>

  <section class="band">
    <h2>The problem</h2>
    <p>{data.problem}</p>
  </section>

  <section class="band band--alt">
    <h2>What {data.name} does</h2>
    <p>{data.solution}</p>
    <ul>
      {#each data.advantages as line}<li>{line}</li>{/each}
    </ul>
  </section>

  <section class="band">
    <h2>How it works on Midnight</h2>
    <div class="grid">
      <article><h3>Compact circuit</h3><code>{data.architecture.circuit}</code></article>
      <article><h3>Public ledger</h3><p>{data.architecture.publicState}</p></article>
      <article><h3>Private witness</h3><p>{data.architecture.witness}</p></article>
      <article><h3>Local private state</h3><p>{data.architecture.privateState}</p></article>
    </div>
  </section>

  <section class="band band--alt">
    <h2>Privacy model</h2>
    <div class="split">
      <div>
        <h3>Observer can see</h3>
        <ul>{#each data.privacy.observerSees as x}<li>{x}</li>{/each}</ul>
      </div>
      <div>
        <h3>Observer cannot see</h3>
        <ul>{#each data.privacy.observerCannotSee as x}<li>{x}</li>{/each}</ul>
      </div>
    </div>
  </section>

  <section class="band">
    <h2>Why this matters</h2>
    <p>{data.significance}</p>
  </section>

  <section class="band band--cta">
    <h2>Try the terminal</h2>
    <a class="cta" href={data.cta.href}>{data.cta.label}</a>
  </section>
</main>

<style>
  .landing { padding: 4rem 1.5rem; max-width: 64rem; margin: 0 auto; }
  .kicker { text-transform: uppercase; letter-spacing: 0.18em; font-size: 0.7rem; color: var(--secondary); }
  .hero h1 { font-size: clamp(2.5rem, 6vw, 4.5rem); line-height: 1.05; margin: 0.5rem 0 1rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.04em; }
  .oneLiner { font-size: 1.25rem; max-width: 38rem; color: var(--ink); }
  .cta { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.25rem; background: var(--primary); color: var(--paper); text-decoration: none; text-transform: uppercase; letter-spacing: 0.15em; font-size: 0.85rem; border: 2px solid var(--primary); }
  .cta:hover { background: var(--paper); color: var(--primary); }
  .band { padding: 3rem 0; border-top: 2px solid var(--primary); margin-top: 2rem; }
  .band--alt { background: rgba(255, 0, 229, 0.04); }
  .band h2 { font-size: 1.5rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--primary); margin: 0 0 1rem; }
  .band p, .band li { line-height: 1.55; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 1rem; }
  .grid article { border: 2px solid var(--primary); padding: 1rem; background: var(--paper); }
  .grid h3 { margin: 0 0 0.5rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.15em; color: var(--secondary); }
  .grid code { font-family: ui-monospace, monospace; }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
  .split h3 { color: var(--secondary); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem; }
  ul { padding-left: 1.25rem; }
  .band--cta { text-align: center; border-top: 2px solid var(--secondary); }
  @media (max-width: 768px) { .split { grid-template-columns: 1fr; } }
</style>
