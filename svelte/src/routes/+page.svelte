<script lang="ts">
  import { onMount } from 'svelte';
  let url = '';
  let linkSummary: any = null;
  let error = '';

  async function fetchLinks() {
    if (url.trim()) {
      try {
        const response = await fetch(`http://localhost:8000/links?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data from server');
        }
        linkSummary = await response.json();
      } catch (err) {
        if (err instanceof Error) {
          error = err.message;
        } else {
          error = String(err);
        }
      }
    }
  }
</script>

<main>
  <h1>Site Page Link Finder</h1>
  <input type="text" bind:value={url} placeholder="Enter URL" />
  <button on:click={fetchLinks}>Find Links</button>
  {#if error}
    <p style="color: red">{error}</p>
  {/if}
  {#if linkSummary}
    <div>
      <h2>Link Summary</h2>
      <ul>
        <li>Total Links: {linkSummary.total_links}</li>
        <li>Main Text Links: {linkSummary.main_text_links}</li>
        <li>Image Links Within Main Text: {linkSummary.image_links_within_main_text}</li>
        <li>Regular Links Within Main Text: {linkSummary.regular_links_within_main_text}</li>
        <li>Other Links: {linkSummary.other_links}</li>
      </ul>
    </div>
  {/if}
</main>
