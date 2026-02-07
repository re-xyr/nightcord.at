import { Address4, Address6 } from 'ip-address'

export function getRateLimitKey(ip: string | null) {
  if (!ip) {
    console.error('Request has no origin IP, using fallback rate limit key')
    return 'unknown'
  }
  try {
    return new Address4(ip).correctForm()
  } catch {
    try {
      return new Address6(ip).mask(64)
    } catch {
      console.error('Invalid IP address format, using fallback rate limit key:', ip)
      return 'invalid'
    }
  }
}
