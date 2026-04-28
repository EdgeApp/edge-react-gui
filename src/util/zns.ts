import { ZNS } from 'zcashname-sdk'

// Canonical suffix used when rendering a name resolved from an address.
export const ZNS_SUFFIX = '.zcash'

// All suffixes accepted as ZNS input. Order matters for `stripZnsSuffix`:
// longer suffixes must be checked first so that e.g. ".zcash" is preferred
// over a hypothetical ".z" prefix-match.
const ZNS_INPUT_SUFFIXES = ['.zcash', '.zec'] as const

// The SDK's `network` option only selects the registry address; its `url`
// always falls back to the testnet indexer unless overridden explicitly.
const ZNS_MAINNET_URL = 'https://main.zcashnames.com'

let znsClient: ZNS | null = null

const getZns = (): ZNS => {
  znsClient ??= new ZNS({ network: 'mainnet', url: ZNS_MAINNET_URL })
  return znsClient
}

export const resetZnsClient = (): void => {
  znsClient = null
}

export const isZnsName = (input: string): boolean => {
  const lower = input.toLowerCase()
  return ZNS_INPUT_SUFFIXES.some(suffix => lower.endsWith(suffix))
}

export const stripZnsSuffix = (input: string): string => {
  const lower = input.toLowerCase()
  for (const suffix of ZNS_INPUT_SUFFIXES) {
    if (lower.endsWith(suffix))
      return lower.slice(0, lower.length - suffix.length)
  }
  return lower
}

export const resolveZnsName = async (input: string): Promise<string | null> => {
  const reg = await getZns().resolveName(stripZnsSuffix(input))
  return reg?.address ?? null
}

export const reverseResolveZnsAddress = async (
  address: string
): Promise<string | null> => {
  const regs = await getZns().resolveAddress(address, 1, 0)
  return regs.length > 0 ? `${regs[0].name}${ZNS_SUFFIX}` : null
}
