import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Returns a random number uniformly distributed in [min, max).
export function unif(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// Returns true with probability p, and false with probability 1 - p.
export function bernoulli(p: number): boolean {
  return Math.random() < p
}

export function cn(...classes: Parameters<typeof clsx>): string {
  return twMerge(clsx(...classes))
}

export function singleton<T>(make: () => T): () => T {
  let instance: T | null = null
  return () => {
    if (!instance) {
      instance = make()
    }
    return instance
  }
}
