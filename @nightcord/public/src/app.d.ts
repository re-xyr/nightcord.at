import type { Database } from '@nightcord/shared/db'
import type { ServiceEvent } from '@nightcord/shared/events'

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: Database
      postRateLimiter: RateLimit
      viewRateLimiter: RateLimit
      visitor: {
        ip: string | null
        userAgent: string | null
        country: string | null
        region: string | null
        city: string | null
      }
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: Env
    }
  }
}

export {}
