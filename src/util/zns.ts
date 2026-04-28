import { ZNS } from 'zcashname-sdk'

export const ZNS_SUFFIX = '.zcash'

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

export const isZnsName = (input: string): boolean =>
  input.toLowerCase().endsWith(ZNS_SUFFIX)

export const stripZnsSuffix = (input: string): string => {
  const lower = input.toLowerCase()
  return lower.endsWith(ZNS_SUFFIX)
    ? lower.slice(0, lower.length - ZNS_SUFFIX.length)
    : lower
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
