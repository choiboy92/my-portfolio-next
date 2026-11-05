import type { AppleCareTier } from './schema'

export function formatPounds(amount: number): string {
  return `£${Number.isInteger(amount) ? amount : amount.toFixed(2)}`
}

export function formatAppleCarePrice(tier: AppleCareTier): string {
  return `${formatPounds(tier.price)}/${tier.billing === 'monthly' ? 'month' : 'year'}`
}
