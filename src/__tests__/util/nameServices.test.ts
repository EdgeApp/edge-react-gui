import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { globalKeys } from '../../keys'
import {
  clearReverseLookupCache,
  peekReverseLookupCache,
  reverseLookupName
} from '../../util/nameServices'

const nickAddress = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'

const makeAccount = (
  lookupEnsName: (address: string) => Promise<string | null>
): EdgeAccount =>
  ({
    currencyConfig: { ethereum: { otherMethods: { lookupEnsName } } }
  } as unknown as EdgeAccount)

describe('reverseLookupName ENS', () => {
  beforeEach(() => {
    // Leave Unstoppable Domains out so ENS is the only service that runs:
    globalKeys.UNSTOPPABLE_DOMAINS_API_KEY = null
    clearReverseLookupCache()
  })

  it("returns the ethereum plugin's primary name and caches it", async () => {
    const lookupEnsName = jest.fn(async (_address: string) => 'nick.eth')
    const account = makeAccount(lookupEnsName)

    expect(await reverseLookupName(account, 'ethereum', nickAddress)).toEqual({
      name: 'nick.eth',
      service: 'ens'
    })
    expect(lookupEnsName).toHaveBeenCalledWith(nickAddress)
    expect(peekReverseLookupCache('ethereum', nickAddress)).toEqual({
      name: 'nick.eth',
      service: 'ens'
    })

    await reverseLookupName(account, 'ethereum', nickAddress)
    expect(lookupEnsName).toHaveBeenCalledTimes(1)
  })

  it('caches an address with no primary name', async () => {
    const lookupEnsName = jest.fn(async (_address: string) => null)
    const account = makeAccount(lookupEnsName)

    expect(await reverseLookupName(account, 'ethereum', nickAddress)).toBe(null)
    await reverseLookupName(account, 'ethereum', nickAddress)
    expect(lookupEnsName).toHaveBeenCalledTimes(1)
  })

  it('retries after the ethereum plugin fails', async () => {
    const lookupEnsName = jest.fn(async (_address: string) => {
      throw new Error('All RPC servers failed')
    })
    const account = makeAccount(lookupEnsName)

    expect(await reverseLookupName(account, 'ethereum', nickAddress)).toBe(null)
    await reverseLookupName(account, 'ethereum', nickAddress)
    expect(lookupEnsName).toHaveBeenCalledTimes(2)
  })

  it('returns null without an ethereum plugin', async () => {
    const account = { currencyConfig: {} } as unknown as EdgeAccount
    expect(await reverseLookupName(account, 'ethereum', nickAddress)).toBe(null)
  })
})
