<script lang="ts">
import '@fontsource-variable/eb-garamond'
import '@fontsource-variable/eb-garamond/wght-italic.css'
import '../app.css'
import banner from '$lib/assets/empty-sekai.png'
import { Toaster } from 'svelte-sonner'

let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href="/favicon.svg" />

  <title>nightcord.at/25</title>

  <meta name="description" content="「光って　光って　眠らない25時」" />

  <meta property="og:image" content={banner} />
  <meta property="og:title" content="nightcord.at/25" />
  <meta property="og:site_name" content="nightcord.at/25" />
</svelte:head>

<Toaster
  position="top-right"
  toastOptions={{
    unstyled: true,
    class:
      'text-sm flex flex-row items-center gap-2 font-serif rounded-none bg-black border-none p-3 w-64 shadow-lg shadow-black/25 text-white',
  }}
/>

{@render children?.()}
