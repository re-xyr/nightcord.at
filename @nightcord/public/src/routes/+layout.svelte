<script lang="ts">
import '../app.css'
import favicon from '$lib/assets/favicon.svg'

let { children } = $props()
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="flex max-w-lg flex-col gap-4 p-4">
  {@render children?.()}
</div>
