<script lang="ts">
  import { Turnstile } from 'svelte-turnstile'
  import { N25_PUBLIC_CF_TURNSTILE_SITEKEY, N25_PUBLIC_DEPLOYMENT_ENV } from '$env/static/public'
  import { submitPost } from '$lib/api/submit-post.remote'
  import { getPosts } from '$lib/api/get-posts.remote'

  let message = $state('')
  let turnstileToken = $state('')
  let submittable = $derived.by(() => {
    if (!message) return false
    if (!turnstileToken && N25_PUBLIC_DEPLOYMENT_ENV !== 'dev') return false
    return true
  })

  async function submit() {
    const result = await submitPost({
      content: message,
      turnstileToken,
    })

    if (!result.success) {
      alert(`Error submitting message: ${result.error}`)
      return
    }
  }
</script>

<h2>Submit a message</h2>
<textarea bind:value={message} placeholder="Your message..." rows="4" cols="50"></textarea>
<Turnstile
  siteKey={N25_PUBLIC_CF_TURNSTILE_SITEKEY}
  on:callback={e => (turnstileToken = e.detail.token)}
/>
<button onclick={submit} disabled={!submittable}>Submit</button>

{#await getPosts() then posts}
  {#each posts as post}
    <div class="post">
      <p>{post.content}</p>
      <small>Submitted at {new Date(post.createdAt).toLocaleString()}</small>
      <small>{post.authorCity}, {post.authorRegion}, {post.authorCountry}</small>
    </div>
  {/each}
{:catch}
  Unable to load posts.
{/await}
