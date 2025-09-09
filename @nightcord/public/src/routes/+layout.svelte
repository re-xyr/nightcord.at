<script lang="ts">
import '../app.css'
import favicon from '$lib/assets/favicon.svg'
import banner from '$lib/assets/empty-sekai.png'

let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />

  <title>nightcord.at/25</title>

  <meta name="description" content="「光って　光って　眠らない25時」" />

  <meta property="og:image" content={banner} />
  <meta property="og:title" content="nightcord.at/25" />
  <meta property="og:site_name" content="nightcord.at/25" />
</svelte:head>

{@render children?.()}
