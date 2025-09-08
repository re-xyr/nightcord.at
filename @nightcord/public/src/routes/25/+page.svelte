<script lang="ts">
import { Turnstile } from 'svelte-turnstile'
import { N25_PUBLIC_CF_TURNSTILE_SITEKEY, N25_PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'
import { submitPost } from '$lib/api/submit-post.remote'
import { getPosts } from '$lib/api/get-posts.remote'
import type { TurnstileObject } from 'turnstile-types'
import Fragments from '$lib/components/fragments.svelte'

let message = $state('')
let turnstile: TurnstileObject | null = $state(null)
let widgetId: string | null = $state(null)

let pending = $state(false)
let submittable = $derived(
  !pending && turnstile != null && widgetId != null && message.trim().length > 0,
)

async function initiateSubmit() {
  if (!turnstile || !widgetId) return

  pending = true
  if (N25_PUBLIC_DEPLOYMENT_ENV === 'dev') {
    finishSubmit('')
  } else {
    turnstile.execute(widgetId)
  }
}

async function finishSubmit(turnstileToken: string) {
  try {
    turnstile?.reset(widgetId!)
    const result = await submitPost({
      content: message,
      turnstileToken,
    })

    if (!result.success) {
      alert(`Error submitting message: ${result.error}`)
    } else {
      message = ''
    }
  } finally {
    pending = false
  }
}
</script>

<Fragments count={300} />
<!--
<h2 class="font-bold">Submit a message</h2>

<div class="flex flex-row items-stretch gap-4">
  <textarea
    bind:value={message}
    placeholder="Your message..."
    class="w-lg h-24 rounded-md border border-slate-300 p-2"
  ></textarea>

  <button
    onclick={initiateSubmit}
    disabled={!submittable}
    class="w-32 rounded-md bg-slate-700 px-4 text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400"
  >
    {#if pending}
      <div class="text-bold animate-spin">◌</div>
    {:else}
      Submit
    {/if}
  </button>
</div>

<Turnstile
  siteKey={N25_PUBLIC_CF_TURNSTILE_SITEKEY}
  appearance="interaction-only"
  execution="execute"
  bind:turnstile
  bind:widgetId
  on:callback={e => finishSubmit(e.detail.token)}
/>

{#await getPosts() then posts}
  {#each posts as post}
    <div class="border-t border-slate-300 pt-4">
      <p lang={post.language}>{post.content}</p>
      <div class="text-right text-xs text-slate-500">
        {new Date(post.createdAt).toLocaleString()}
        from {post.authorCity}, {post.authorRegion}, {post.authorCountry}
      </div>
    </div>
  {/each}
{:catch}
  Unable to load posts.
{/await} -->
