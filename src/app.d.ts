import type { D1Database } from '@cloudflare/workers-types'
import type { Database } from '$lib/server/db'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Database
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        DB: D1Database
      }
    }
  }
}

export {}
