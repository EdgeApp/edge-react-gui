import { asObject, asOptional, asString, asValue } from 'cleaners'
import type { EdgeAccount } from 'edge-core-js'
import { ethers } from 'ethers'

import { doc } from '../doc'
import { engineError } from '../errors'
import { findWallet, getCurrencyCode, parseTokenId } from '../resolve'
import { route } from '../route'
import { asTokenId, asWalletId } from '../schemas'
import { getAccount } from './helpers'

/** Where the Edge app keeps the FIO names the user has paid or been paid by. */
export const FIO_ADDRESS_CACHE = 'FioAddressCache.json'

/**
 * Reads the names out of the app's FIO address cache.
 *
 * The file is `{ addresses: { "<name>": true } }`, written by the GUI's
 * `addToFioAddressCache`. A missing or corrupt file is an empty cache, as it
 * is in the GUI: the cache is a convenience, never a reason to fail.
 */
export async function readFioAddressCache(
  account: EdgeAccount
): Promise<string[]> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await account.disklet.getText(FIO_ADDRESS_CACHE))
  } catch (error: unknown) {
    return []
  }
  const addresses =
    parsed != null && typeof parsed === 'object'
      ? (parsed as { addresses?: unknown }).addresses
      : undefined
  if (addresses == null || typeof addresses !== 'object') return []
  const names = Object.keys(addresses).map(name => name.toLowerCase())
  return Array.from(new Set(names)).sort()
}

export type NameService = 'fio' | 'ens'

/**
 * Which service a name belongs to, decided from its shape alone.
 *
 * One `@` is a FIO name. A last label of `eth` is ENS, which includes
 * subnames such as `alice.base.eth`. ENS also covers DNS names imported with
 * DNSSEC, but those cannot be told apart from ordinary domains by shape, so
 * they are not accepted.
 */
export function nameServiceOf(name: string): NameService | undefined {
  if (/^[^@\s]+@[^@\s]+$/.test(name)) return 'fio'
  const labels = name.split('.')
  if (
    labels.length >= 2 &&
    labels[labels.length - 1] === 'eth' &&
    labels.every(label => /^[^\s.@/:]+$/.test(label))
  ) {
    return 'ens'
  }
  return undefined
}

/** The `labelCode`s the FIO plugin puts on its lookup errors. */
const FIO_BAD_NAME = 'INVALID_FIO_ADDRESS'
const FIO_NO_ADDRESS = ['FIO_ADDRESS_IS_NOT_EXIST', 'FIO_ADDRESS_IS_NOT_LINKED']

/**
 * The reverse ENS lookup. Replaceable so tests do not reach mainnet.
 *
 * ethers' default provider is what the GUI's reverse lookups use
 * (`src/util/nameServices.ts`), so the CLI agrees with the app about a name.
 */
export let lookupEnsName = async (address: string): Promise<string | null> =>
  await ethers.getDefaultProvider('mainnet').lookupAddress(address)

export function setLookupEnsName(
  lookup: (address: string) => Promise<string | null>
): void {
  lookupEnsName = lookup
}

/**
 * The FIO names the user has sent to, requested from, or been paid by.
 *
 * The Edge app adds a name to this list whenever the user sends to a FIO
 * name, sends a FIO request, or receives a transaction from one. The list
 * lives in the account's synced storage, so it holds names used on any
 * device.
 *
 * @note Names only. Resolve one to an address for a given wallet with
 *   `resolve-name`.
 * @returns `{ names }`, lowercased and sorted.
 */
export const fioAddressCache = route({
  core: 'account.disklet',
  method: 'GET',
  path: '/account/{sessionId}/fio-address-cache',
  cli: 'fio-address-cache',
  returns: asObject({
    names: doc((raw: unknown): string[] => {
      if (!Array.isArray(raw)) throw new TypeError('Expected an array')
      return raw.map(name => asString(name))
    }, 'Cached FIO names, such as `paul@edge`.')
  }),

  async handler(ctx) {
    return { names: await readFioAddressCache(getAccount(ctx)) }
  }
})

/**
 * Resolve a FIO or ENS name to an address for one wallet.
 *
 * FIO names (`name@domain`) resolve through the FIO chain to the address the
 * owner connected for this wallet's chain and token. ENS names ending in
 * `.eth` resolve on Ethereum mainnet, and only for Ethereum wallets, followed
 * by a reverse lookup that tells whether the address uses that name as its
 * primary name.
 *
 * @note The name is checked before any plugin is called, so a bare address or
 *   a name of any other shape fails without touching the network.
 * @coreNote Calls the FIO plugin's `otherMethods.getConnectedPublicAddress`,
 *   the Ethereum plugin's `otherMethods.resolveEnsName`, and ethers'
 *   `lookupAddress` for the reverse record.
 * @returns `{ name, service, address, reverseName }`.
 */
export const resolveName = route({
  core: null,
  method: 'POST',
  path: '/account/{sessionId}/wallet/resolve-name',
  cli: 'resolve-name',
  body: asObject({
    walletId: asWalletId,
    tokenId: asOptional(
      doc(asTokenId, 'The token to pay in. Omit for the chain asset.')
    ),
    name: doc(asString, 'A FIO name such as `paul@edge`, or `alice.eth`.')
  }).withRest,
  returns: asObject({
    name: doc(asString, 'The name, lowercased.'),
    service: doc(asValue('fio', 'ens'), 'Which service resolved it.'),
    address: doc(asString, 'The address to pay.'),
    reverseName: doc(
      (raw: unknown): string | null => (raw == null ? null : asString(raw)),
      "ENS only: the address's primary name, or null. Always null for FIO."
    )
  }),
  errors: ['BAD_REQUEST', 'NOT_FOUND', 'WALLET_NOT_FOUND'],

  async handler(ctx) {
    const account = getAccount(ctx)
    const name = ctx.body.name.trim().toLowerCase()
    const service = nameServiceOf(name)
    if (service == null) {
      throw engineError('BAD_REQUEST', 'Not a FIO or .eth name', 400)
    }

    const wallet = findWallet(account, ctx.body.walletId)
    const tokenId = parseTokenId(ctx.body.tokenId)
    const currencyCode = getCurrencyCode(wallet, tokenId)
    const notFound = (): Error =>
      engineError('NOT_FOUND', `${name} has no ${currencyCode} address`, 404)

    if (service === 'ens') {
      if (wallet.currencyInfo.pluginId !== 'ethereum') {
        throw engineError(
          'BAD_REQUEST',
          'ENS names pay Ethereum wallets only',
          400
        )
      }
      const ethereum = account.currencyConfig.ethereum
      const address: string | null | undefined =
        await ethereum.otherMethods.resolveEnsName(name)
      if (address == null || address === '') throw notFound()
      const reverse = await lookupEnsName(address)
      return {
        name,
        service,
        address,
        reverseName: reverse == null ? null : reverse.toLowerCase()
      }
    }

    const fio = account.currencyConfig.fio
    let result: { public_address?: string } | undefined
    try {
      result = await fio.otherMethods.getConnectedPublicAddress(
        name,
        wallet.currencyInfo.currencyCode,
        currencyCode
      )
    } catch (error: unknown) {
      const labelCode = (error as { labelCode?: string }).labelCode
      if (labelCode === FIO_BAD_NAME) {
        throw engineError('BAD_REQUEST', `${name} is not a valid FIO name`, 400)
      }
      if (labelCode != null && FIO_NO_ADDRESS.includes(labelCode)) {
        throw notFound()
      }
      throw error
    }
    const address = result?.public_address
    if (address == null || address === '' || address === '0') throw notFound()
    return { name, service, address, reverseName: null }
  }
})
