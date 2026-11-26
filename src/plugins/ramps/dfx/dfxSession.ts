import type { EdgeCurrencyWallet } from 'edge-core-js'

import { RampIpCountryError } from '../../../types/RampIpCountryError'
import { RampLoginError } from '../../../types/RampLoginError'
import { utf8 } from '../../../util/encoding'
import { raceTimeout, TIMED_OUT } from '../../../util/raceTimeout'
import { fetchDfx } from './dfxApi'
import { asDfxAuthResponse, asDfxSignMessageResponse } from './dfxRampTypes'

// The quote approval waits for the login, so a slow DFX API must not hold
// the user on the quote list.
const DFX_LOGIN_TIMEOUT_MS = 10000

// DFX's ownership message, which ends with the address being logged in.
// Edge signs nothing else, so a bad or compromised API response cannot
// collect the wallet's signature on other text.
const DFX_SIGN_MESSAGE_PREFIX =
  'By_signing_this_message,_you_confirm_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_'

interface DfxChain {
  /** Blockchain name as DFX spells it (api.dfx.swiss/v1/asset) */
  readonly blockchain: string
  /** DFX name of the chain's native asset */
  readonly asset: string
  /**
   * Signs the message bytes with `signBytes`, as EVM and Monero wallets do.
   * Every wallet has a `signBytes` method, but it rejects unless the
   * chain's engine implements it. Bitcoin's engine only implements the
   * deprecated `signMessage`, which core's `signBytes` falls back to with
   * the bytes as base64 text, a signature DFX would not verify. So Bitcoin
   * signs the literal message with `signMessage` instead.
   */
  readonly signsBytes: boolean
}

/**
 * Chains where Edge logs the wallet into DFX before opening the webview.
 * The plugin offers DFX on these chains only.
 */
export const DFX_SESSION_CHAINS: Readonly<Record<string, DfxChain>> = {
  bitcoin: { blockchain: 'Bitcoin', asset: 'BTC', signsBytes: false },
  ethereum: { blockchain: 'Ethereum', asset: 'ETH', signsBytes: true },
  arbitrum: { blockchain: 'Arbitrum', asset: 'ETH', signsBytes: true },
  optimism: { blockchain: 'Optimism', asset: 'ETH', signsBytes: true },
  polygon: { blockchain: 'Polygon', asset: 'POL', signsBytes: true },
  base: { blockchain: 'Base', asset: 'ETH', signsBytes: true },
  binancesmartchain: {
    blockchain: 'BinanceSmartChain',
    asset: 'BNB',
    signsBytes: true
  },
  monero: { blockchain: 'Monero', asset: 'XMR', signsBytes: true }
}

export interface DfxSessionParams {
  readonly wallet: EdgeCurrencyWallet
  /** Partner wallet name DFX attributes the user to */
  readonly walletName: string
}

/**
 * Signs DFX's ownership message with the wallet and returns the `session`
 * query parameter that opens DFX logged in with the wallet's address.
 * Returns undefined for a chain without a session login, which opens DFX
 * without one. Throws RampLoginError, which asks the user to try again and
 * names the cause for error reports, when the login fails: without
 * `session`, DFX would open with whatever login it last saved on the
 * device, which can be another wallet or another Edge account. Throws
 * RampIpCountryError when DFX blocks the country of the user's IP address,
 * since DFX's own login would fail the same way.
 */
export async function fetchDfxSessionQuery(
  params: DfxSessionParams
): Promise<Record<string, string> | undefined> {
  const chain = DFX_SESSION_CHAINS[params.wallet.currencyInfo.pluginId]
  if (chain == null) return undefined

  try {
    const query = await raceTimeout(
      loginToDfx(params, chain),
      DFX_LOGIN_TIMEOUT_MS
    )
    if (query === TIMED_OUT) {
      throw new Error(`login timed out after ${DFX_LOGIN_TIMEOUT_MS}ms`)
    }
    return query
  } catch (error: unknown) {
    if (error instanceof RampIpCountryError) throw error
    throw new RampLoginError('DFX', error)
  }
}

async function loginToDfx(
  params: DfxSessionParams,
  chain: DfxChain
): Promise<Record<string, string>> {
  const { wallet, walletName } = params
  const address = await getDfxAddress(wallet)

  const { message, blockchains } = asDfxSignMessageResponse(
    await fetchDfx(`/auth/signMessage?address=${encodeURIComponent(address)}`)
  )
  if (!blockchains.includes(chain.blockchain)) {
    throw new Error(`address not accepted on ${chain.blockchain}`)
  }
  if (message !== DFX_SIGN_MESSAGE_PREFIX + address) {
    throw new Error('unexpected signMessage text')
  }

  // UTXO wallets sign the literal message: `signBytes` would base64 it
  // first and DFX would verify a signature over the wrong data.
  const signature = chain.signsBytes
    ? await wallet.signBytes(utf8.parse(message))
    : // eslint-disable-next-line @typescript-eslint/no-deprecated
      await wallet.signMessage(message, {
        otherParams: { publicAddress: address }
      })

  const { accessToken } = asDfxAuthResponse(
    await fetchDfx('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature, wallet: walletName })
    })
  )
  // An empty `session` opens DFX without a login, like a failed login:
  if (accessToken === '') throw new Error('DFX returned an empty access token')

  return { session: accessToken }
}

/**
 * DFX ties the login to the address, so it always uses the wallet's first
 * address: the current receive address moves on once it receives funds, and
 * a later login from it would reach DFX as a different user.
 * Prefers the segwit address on UTXO wallets.
 */
async function getDfxAddress(wallet: EdgeCurrencyWallet): Promise<string> {
  const addresses = await wallet.getAddresses({ tokenId: null, forceIndex: 0 })
  const address =
    addresses.find(item => item.addressType === 'segwitAddress') ?? addresses[0]
  if (address == null) throw new Error('wallet has no receive address')
  return address.publicAddress
}
