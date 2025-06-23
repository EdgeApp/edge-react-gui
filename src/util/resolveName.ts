import { EdgeCurrencyWallet } from 'edge-core-js'

import { ResolutionError } from '../types/ResolutionError'

export const resolveName = async (
  wallet: EdgeCurrencyWallet,
  name: string
): Promise<string> => {
  if (typeof wallet.otherMethods.resolveName !== 'function') {
    throw new ResolutionError('UnsupportedDomain', { domain: name })
  }

  const address = await wallet.otherMethods.resolveName(name)
  if (address == null)
    throw new ResolutionError('UnregisteredDomain', { domain: name })
  return address
}
