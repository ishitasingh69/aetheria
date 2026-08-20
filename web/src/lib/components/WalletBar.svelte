<script lang="ts">
  import { connection, connectWallet, disconnectWallet } from '../stores/aetheria';

  function truncHex(hex: string, head = 10, tail = 6): string {
    return hex.length <= head + tail + 1 ? hex : `${hex.slice(0, head)}…${hex.slice(-tail)}`;
  }

  async function onClick() {
    if ($connection.connected) {
      await disconnectWallet();
    } else {
      try {
        await connectWallet();
      } catch (e) {
        // error surfaces via $connection.error
      }
    }
  }
</script>

<div class="wallet-bar">
  <button onclick={onClick} disabled={$connection.connecting}>
    {#if $connection.connecting}
      connecting…
    {:else if $connection.connected}
      {truncHex($connection.unshieldedAddress ?? '')} · disconnect
    {:else}
      connect wallet
    {/if}
  </button>
  {#if $connection.error}
    <span class="ask">{$connection.error}</span>
  {/if}
</div>

<style>
  .wallet-bar {
    display: flex;
    align-items: center;
    gap: calc(var(--unit) * 3);
  }
</style>
