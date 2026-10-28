import { UNSTOPPABLE_DOMAINS } from '../constants/WalletAndCurrencyConstants'

/**
 * Whether the input looks like a name ENS can resolve.
 * ENS resolves DNS names as well as .eth names, so any dotted name counts,
 * except for Unstoppable Domains names, which ENS does not serve.
 */
export function isEnsName(input: string): boolean {
  const name = input.trim().toLowerCase()

  // Rule out URIs, emails, FIO handles, and anything with spaces:
  if (/[\s@:/?#]/.test(name)) return false
  if (UNSTOPPABLE_DOMAINS.some(suffix => name.endsWith(suffix))) return false

  const labels = name.split('.')
  if (labels.length < 2 || labels.some(label => label === '')) return false

  // The top-level label must look like a real TLD, which rules out
  // numbers such as "1.5":
  const tld = labels[labels.length - 1]
  return /^([a-z]{2,}|xn--[a-z0-9-]+)$/.test(tld)
}
