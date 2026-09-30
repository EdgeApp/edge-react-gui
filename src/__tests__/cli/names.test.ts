import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { ethers } from 'ethers'

import {
  fioAddressCache,
  lookupEnsName,
  nameServiceOf,
  readFioAddressCache,
  resolveName,
  setLookupEnsName
} from '../../cli/engine/routes/names'

interface ThrownEngineError extends Error {
  code: string
  status: number
}

async function codeOf(
  result: unknown
): Promise<{ code: string; message: string }> {
  try {
    await Promise.resolve(result)
  } catch (error) {
    const engineError = error as ThrownEngineError
    return { code: engineError.code, message: engineError.message }
  }
  throw new Error('expected a rejection')
}

const LTC = 'ltc-wallet-id'
const ETH = 'eth-wallet-id'
const USDC = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

interface FakeAccount {
  account: any
  getConnectedPublicAddress: jest.Mock<
    (name: string, chainCode: string, tokenCode: string) => Promise<unknown>
  >
  resolveEnsName: jest.Mock<
    (name: string) => Promise<string | null | undefined>
  >
}

function makeAccount(opts: {
  cacheText?: string | Error
  fioResult?: unknown
  fioError?: Error
  ensAddress?: string | null
}): FakeAccount {
  const getConnectedPublicAddress = jest.fn(
    async (name: string, chainCode: string, tokenCode: string) => {
      if (opts.fioError != null) throw opts.fioError
      return opts.fioResult
    }
  )
  const resolveEnsName = jest.fn(async (name: string) => opts.ensAddress)
  const wallet = (pluginId: string, currencyCode: string): unknown => ({
    currencyInfo: {
      pluginId,
      currencyCode,
      denominations: [{ multiplier: '100000000' }]
    },
    currencyConfig: {
      allTokens: {
        [USDC]: { currencyCode: 'USDC', denominations: [{ multiplier: '1' }] }
      }
    }
  })
  const account = {
    disklet: {
      getText: jest.fn(async (path: string) => {
        if (opts.cacheText instanceof Error) throw opts.cacheText
        if (opts.cacheText == null) throw new Error('missing')
        return opts.cacheText
      })
    },
    currencyWallets: {
      [LTC]: wallet('litecoin', 'LTC'),
      [ETH]: wallet('ethereum', 'ETH')
    },
    currencyConfig: {
      fio: { otherMethods: { getConnectedPublicAddress } },
      ethereum: { otherMethods: { resolveEnsName } }
    }
  }
  return { account, getConnectedPublicAddress, resolveEnsName }
}

function makeCtx(account: unknown, body?: unknown): any {
  return {
    params: { sessionId: 'sess_test' },
    state: {
      sessions: {
        get: () => ({ account }),
        touch: () => {}
      }
    },
    body,
    query: Object.assign(new URLSearchParams(), { valid: {} })
  }
}

describe('fio-address-cache', () => {
  it('returns the cached names, lowercased and sorted', async () => {
    const { account } = makeAccount({
      cacheText: JSON.stringify({
        addresses: { 'Paul@Edge': true, 'bob@edge': true, 'paul@edge': true }
      })
    })
    expect(await fioAddressCache.handler(makeCtx(account))).toEqual({
      names: ['bob@edge', 'paul@edge']
    })
  })

  it('reads a missing file as empty', async () => {
    const { account } = makeAccount({})
    expect(await readFioAddressCache(account)).toEqual([])
  })

  it('reads a corrupt file as empty', async () => {
    const { account } = makeAccount({ cacheText: '{not json' })
    expect(await readFioAddressCache(account)).toEqual([])
  })

  it('reads a file without addresses as empty', async () => {
    const { account: a } = makeAccount({ cacheText: '{"other":1}' })
    expect(await readFioAddressCache(a)).toEqual([])
    const { account: b } = makeAccount({ cacheText: 'null' })
    expect(await readFioAddressCache(b)).toEqual([])
  })
})

describe('response shapes', () => {
  it('match their documented cleaners', () => {
    const cache: any = fioAddressCache
    expect(cache.returns({ names: ['a@b'] })).toEqual({ names: ['a@b'] })
    expect(() => cache.returns({ names: 'a@b' })).toThrow('array')
    const resolve: any = resolveName
    expect(
      resolve.returns({
        name: 'a.eth',
        service: 'ens',
        address: '0x',
        reverseName: null
      }).reverseName
    ).toBeNull()
    expect(
      resolve.returns({
        name: 'a.eth',
        service: 'ens',
        address: '0x',
        reverseName: 'a.eth'
      }).reverseName
    ).toBe('a.eth')
  })
})

describe('the default reverse lookup', () => {
  it("uses ethers' mainnet default provider", async () => {
    const lookupAddress = jest.fn(async (address: string) => 'alice.eth')
    const spy = jest
      .spyOn(ethers, 'getDefaultProvider')
      .mockReturnValue({ lookupAddress } as any)
    expect(await lookupEnsName('0xabc')).toBe('alice.eth')
    expect(spy).toHaveBeenCalledWith('mainnet')
    expect(lookupAddress).toHaveBeenCalledWith('0xabc')
    spy.mockRestore()
  })
})

describe('nameServiceOf', () => {
  it('tells FIO, ENS and everything else apart by shape', () => {
    expect(nameServiceOf('paul@edge')).toBe('fio')
    expect(nameServiceOf('alice.eth')).toBe('ens')
    expect(nameServiceOf('alice.base.eth')).toBe('ens')
    expect(nameServiceOf('someone.cb.id')).toBeUndefined()
    expect(nameServiceOf('alice.com')).toBeUndefined()
    expect(nameServiceOf('eth')).toBeUndefined()
    expect(nameServiceOf('.eth')).toBeUndefined()
    expect(nameServiceOf('a@b@c')).toBeUndefined()
    expect(nameServiceOf('ltc1qsz6cr2hmatn9z92del82vf979ufdqhd2qdkndy')).toBe(
      undefined
    )
    expect(
      nameServiceOf('0x7e517ce6cfdb9b079f833a183fc374d06564d6dc')
    ).toBeUndefined()
  })
})

describe('resolve-name', () => {
  beforeEach(() => {
    setLookupEnsName(async () => null)
  })

  it('resolves a FIO name for a chain asset', async () => {
    const { account, getConnectedPublicAddress } = makeAccount({
      fioResult: { public_address: 'MU1pcw' }
    })
    const result = await resolveName.handler(
      makeCtx(account, { walletId: LTC, name: ' Paul@Edge ' })
    )
    expect(getConnectedPublicAddress).toHaveBeenCalledWith(
      'paul@edge',
      'LTC',
      'LTC'
    )
    expect(result).toEqual({
      name: 'paul@edge',
      service: 'fio',
      address: 'MU1pcw',
      reverseName: null
    })
  })

  it('passes the token code for a token', async () => {
    const { account, getConnectedPublicAddress } = makeAccount({
      fioResult: { public_address: '0xabc' }
    })
    await resolveName.handler(
      makeCtx(account, { walletId: ETH, tokenId: USDC, name: 'paul@edge' })
    )
    expect(getConnectedPublicAddress).toHaveBeenCalledWith(
      'paul@edge',
      'ETH',
      'USDC'
    )
  })

  it('maps the FIO error labels', async () => {
    for (const [labelCode, code] of [
      ['INVALID_FIO_ADDRESS', 'BAD_REQUEST'],
      ['FIO_ADDRESS_IS_NOT_EXIST', 'NOT_FOUND'],
      ['FIO_ADDRESS_IS_NOT_LINKED', 'NOT_FOUND']
    ]) {
      const { account } = makeAccount({
        fioError: Object.assign(new Error('fio'), { labelCode })
      })
      const err = await codeOf(
        resolveName.handler(makeCtx(account, { walletId: LTC, name: 'x@y' }))
      )
      expect(err.code).toBe(code)
    }
  })

  it('passes other FIO failures through', async () => {
    const { account } = makeAccount({ fioError: new Error('network down') })
    await expect(
      resolveName.handler(makeCtx(account, { walletId: LTC, name: 'x@y' }))
    ).rejects.toThrow('network down')
  })

  it('treats an empty or zero FIO address as not found', async () => {
    for (const fioResult of [{ public_address: '0' }, {}, undefined]) {
      const { account } = makeAccount({ fioResult })
      const err = await codeOf(
        resolveName.handler(makeCtx(account, { walletId: LTC, name: 'x@y' }))
      )
      expect(err).toEqual({
        code: 'NOT_FOUND',
        message: 'x@y has no LTC address'
      })
    }
  })

  it('resolves an ENS name with a matching primary name', async () => {
    const { account, resolveEnsName } = makeAccount({ ensAddress: '0xAbC' })
    setLookupEnsName(async address => 'Alice.eth')
    const result = await resolveName.handler(
      makeCtx(account, { walletId: ETH, name: 'alice.eth' })
    )
    expect(resolveEnsName).toHaveBeenCalledWith('alice.eth')
    expect(result).toEqual({
      name: 'alice.eth',
      service: 'ens',
      address: '0xAbC',
      reverseName: 'alice.eth'
    })
  })

  it('reports a different or absent primary name', async () => {
    const { account } = makeAccount({ ensAddress: '0xabc' })
    setLookupEnsName(async () => 'bob.eth')
    const other = (await resolveName.handler(
      makeCtx(account, { walletId: ETH, name: 'alice.base.eth' })
    )) as { reverseName: string | null }
    expect(other.reverseName).toBe('bob.eth')

    setLookupEnsName(async () => null)
    const none = (await resolveName.handler(
      makeCtx(account, { walletId: ETH, name: 'alice.base.eth' })
    )) as { reverseName: string | null }
    expect(none.reverseName).toBeNull()
  })

  it('treats an unregistered ENS name as not found', async () => {
    const { account } = makeAccount({ ensAddress: null })
    const err = await codeOf(
      resolveName.handler(makeCtx(account, { walletId: ETH, name: 'no.eth' }))
    )
    expect(err.code).toBe('NOT_FOUND')
  })

  it('refuses ENS on a non-Ethereum wallet before calling a plugin', async () => {
    const { account, resolveEnsName } = makeAccount({ ensAddress: '0xabc' })
    const err = await codeOf(
      resolveName.handler(
        makeCtx(account, { walletId: LTC, name: 'alice.eth' })
      )
    )
    expect(err).toEqual({
      code: 'BAD_REQUEST',
      message: 'ENS names pay Ethereum wallets only'
    })
    expect(resolveEnsName).not.toHaveBeenCalled()
  })

  it('refuses addresses and other names before calling a plugin', async () => {
    const { account, getConnectedPublicAddress, resolveEnsName } = makeAccount({
      fioResult: { public_address: 'x' },
      ensAddress: '0x1'
    })
    for (const name of [
      'ltc1qsz6cr2hmatn9z92del82vf979ufdqhd2qdkndy',
      '0x7e517ce6cfdb9b079f833a183fc374d06564d6dc',
      'someone.cb.id',
      'alice.com',
      'alice'
    ]) {
      const err = await codeOf(
        resolveName.handler(makeCtx(account, { walletId: ETH, name }))
      )
      expect(err.code).toBe('BAD_REQUEST')
    }
    expect(getConnectedPublicAddress).not.toHaveBeenCalled()
    expect(resolveEnsName).not.toHaveBeenCalled()
  })
})
