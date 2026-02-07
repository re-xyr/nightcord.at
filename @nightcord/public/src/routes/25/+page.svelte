<script lang="ts">
import { Turnstile } from 'svelte-turnstile'
import { N25_PUBLIC_CF_TURNSTILE_SITEKEY, N25_PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'
import { submitPost } from '$lib/api/submit-post.remote'
import { getPosts, type PostView } from '$lib/api/get-posts.remote'
import type { TurnstileObject } from 'turnstile-types'
import Fragments from '$lib/components/fragments.svelte'
import { Fragment } from '$lib/fragment'
import * as _3 from 'three'
import { Dialog } from 'bits-ui'

import { LoaderCircle, Ellipsis, ArrowRight, Plus, MoveDown, Undo2 } from 'lucide-svelte'
import { onMount } from 'svelte'
import { toast } from 'svelte-sonner'

let nickname = $state('')
let message = $state('')
let turnstile: TurnstileObject | null = $state(null)
let widgetId: string | null = $state(null)

let pending = $state(false)
let submittable = $derived.by(() => {
  if (pending) return false

  if (N25_PUBLIC_DEPLOYMENT_ENV === 'production' && (turnstile == null || widgetId == null))
    return false

  if (message.trim().length === 0) return false

  return true
})

async function initiateSubmit() {
  if (!turnstile || !widgetId) return

  pending = true
  if (N25_PUBLIC_DEPLOYMENT_ENV !== 'production') {
    finishSubmit('')
  } else {
    turnstile.execute(widgetId)
  }
}

async function finishSubmit(turnstileToken: string) {
  try {
    turnstile?.reset(widgetId!)
    const result = await submitPost({
      nickname,
      content: message,
      turnstileToken,
    })

    if (!result.success) {
      toast.error(result.error ?? 'Failed to submit your message. Please try again later.')
    } else {
      postDialogOpen = false
      message = ''
      toast.success('Thank you.')
      transientTarget.dispatchEvent(new CustomEvent('transient'))
    }
  } catch (e) {
    console.error(e)
    toast.error('An unexpected error occurred. Please try again later.')
  } finally {
    pending = false
  }
}

let hovered: boolean = $state(false)
let hoverIx: number = $state(0)
let pointer = $state({ x: 0, y: 0 })

$effect(() => {
  if (!overlay) return

  if (pointer.x > 0.8 * innerWidth) {
    overlay.style.right = `${innerWidth - pointer.x}px`
    overlay.style.left = 'auto'
  } else {
    overlay.style.left = `${pointer.x}px`
    overlay.style.right = 'auto'
  }

  if (pointer.y > 0.95 * innerHeight) {
    overlay.style.bottom = `${innerHeight - pointer.y}px`
    overlay.style.top = 'auto'
  } else {
    overlay.style.top = `${pointer.y}px`
    overlay.style.bottom = 'auto'
  }
})

function handleMove(event: MouseEvent) {
  pointer.x = event.clientX
  pointer.y = event.clientY
}

function handleHover(id: number, _frag: Fragment) {
  hovered = true
  hoverIx = id
}

function handleUnhover(_id: number, _frag: Fragment) {
  hovered = false
}

function handleClick(id: number, _frag: Fragment) {
  if (posts.length === 0) return
  viewing = posts[id % posts.length]
  viewDialogOpen = true
}

let viewing: PostView | null = $state(null)
let viewDialogOpen = $state(false)
let postDialogOpen = $state(false)
let posts: PostView[] = $state([])

onMount(async () => {
  posts = await getPosts({ maxEntries: 300 })
})

function truncate(str: string, maxLength: number) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 1) + '…'
}

const transientTarget = new EventTarget()

let overlay: HTMLDivElement | null = $state(null)
</script>

<Fragments
  count={300}
  onpointermove={handleMove}
  onmouseenter={handleHover}
  onmouseleave={handleUnhover}
  onclick={handleClick}
  transient={(listener) => transientTarget.addEventListener('transient', listener)}
/>

<!-- Hover overlay -->
{#if posts.length > 0}
  {@const post = posts[hoverIx % posts.length]}
  <div
    bind:this={overlay}
    class="pointer-events-none fixed bg-black p-2 shadow-lg shadow-black/25 transition-opacity"
    style:opacity={hovered ? 1 : 0}
  >
    {#if post.nickname}
      <span class="font-semibold">{truncate(post.nickname, 30)}:</span>
    {/if}
    {truncate(post.content, 80)}
  </div>
{/if}

<!-- TODO: make this look better -->
<div
  class="group fixed right-0 bottom-0 flex size-48 items-end justify-end bg-linear-to-br from-transparent from-50% to-black/75 p-4 text-white transition-colors focus-within:to-black has-hover:to-black"
>
  <button class="hover:cursor-pointer" onclick={() => (postDialogOpen = true)}>
    <Plus class="size-12" />
  </button>
</div>

<!-- Message submission overlay -->
<Dialog.Root bind:open={postDialogOpen}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/50 bg-radial from-black from-10% to-transparent data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    />
    <Dialog.Content
      interactOutsideBehavior="ignore"
      class="dialog fixed top-[50%] left-[50%] z-50 flex translate-x-[-50%] translate-y-[-50%] items-center justify-center overflow-clip bg-black p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    >
      <div class="relative flex w-dvw max-w-2xl flex-col gap-4">
        <MoveDown class="absolute -top-6 -left-4 inline-block size-16" />

        <Dialog.Title class="grow pl-12 text-3xl">Leave a message</Dialog.Title>

        <input
          bind:value={nickname}
          type="text"
          placeholder="A name (optional)"
          class="border-b border-white/50 p-1 outline-0 focus:border-white focus:bg-white/5"
        />

        <textarea
          bind:value={message}
          placeholder="Your message..."
          class="h-24 border-b border-white/50 p-1 outline-0 transition-colors focus:border-white focus:bg-white/5"
        ></textarea>

        <div class="flex flex-col-reverse sm:flex-row sm:items-center">
          <Dialog.Close
            class="flex h-8 min-w-42 flex-row items-center justify-start gap-2 bg-linear-to-l from-transparent from-0% to-stone-600 to-50% font-medium text-fg transition-colors hover:to-stone-700 not-disabled:hover:cursor-pointer disabled:opacity-50 "
          >
            <div class="flex size-8 items-center justify-center bg-black/25">
              <Undo2 class="size-4" />
            </div>

            <div>Nevermind</div>
          </Dialog.Close>

          <button
            onclick={initiateSubmit}
            disabled={!submittable}
            class="flex h-8 grow flex-row items-center justify-end gap-2 bg-linear-to-r from-transparent from-0% to-accent to-50% font-medium text-fg transition-opacity not-disabled:hover:cursor-pointer disabled:opacity-50"
          >
            <div>
              {#if pending}
                Loading...
              {:else if submittable}
                Submit
              {:else}
                Enter something?
              {/if}
            </div>

            <div class="flex size-8 items-center justify-center bg-black/25">
              {#if pending}
                <LoaderCircle class="animate-spin" />
              {:else if submittable}
                <ArrowRight />
              {:else}
                <Ellipsis />
              {/if}
            </div>
          </button>
        </div>
      </div>

      <Turnstile
        siteKey={N25_PUBLIC_CF_TURNSTILE_SITEKEY}
        appearance="interaction-only"
        execution="execute"
        bind:turnstile
        bind:widgetId
        on:callback={(e) => finishSubmit(e.detail.token)}
      />
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<Dialog.Root bind:open={viewDialogOpen}>
  <Dialog.Portal>
    <Dialog.Overlay
      class="fixed inset-0 z-50 bg-black/50 bg-radial from-black from-10% to-transparent data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    />
    <Dialog.Content
      class="dialog fixed top-[50%] left-[50%] z-50 flex translate-x-[-50%] translate-y-[-50%] items-center justify-center overflow-clip bg-black p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    >
      <div class="relative flex w-dvw max-w-2xl flex-col gap-4">
        <MoveDown class="absolute -top-6 -left-4 inline-block size-16" />

        {#if viewing}
          <Dialog.Title class="grow pl-12 text-3xl">
            {#if viewing.nickname}
              <span class="font-semibold">{viewing.nickname}</span>
            {:else}
              <i>An anonymous voice</i>
            {/if}
            said:
          </Dialog.Title>

          <p class="text-lg whitespace-pre-line">{viewing.content}</p>

          <div class="text-right text-sm font-medium opacity-75">
            {viewing.createdAt.toLocaleString()} in {viewing.authorCity}, {viewing.authorRegion}, {viewing.authorCountry}
          </div>

          <div class="flex flex-col-reverse sm:flex-row sm:items-center">
            <Dialog.Close
              onclick={() => (viewDialogOpen = false)}
              class="flex h-8 grow flex-row items-center justify-end gap-2 bg-linear-to-r from-transparent from-0% to-accent to-50% font-medium text-fg transition-opacity hover:opacity-80 not-disabled:hover:cursor-pointer disabled:opacity-50"
            >
              <div>Move on</div>

              <div class="flex size-8 items-center justify-center bg-black/25">
                <ArrowRight />
              </div>
            </Dialog.Close>
          </div>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

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
