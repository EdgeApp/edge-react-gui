import type { EdgeCurrencyWallet } from 'edge-core-js'

import { utf8 } from '../../../util/encoding'
import { raceTimeout, TIMED_OUT } from '../../../util/raceTimeout'
import { asDfxAuthResponse, asDfxSignMessageResponse } from './dfxRampTypes'

const DFX_API_URL = 'https://api.dfx.swiss/v1'

// The quote approval waits for the login, so a slow DFX API must not hold
// the user on the quote list.
const DFX_LOGIN_TIMEOUT_MS = 10000

interface DfxChain {
  /** Blockchain name as DFX spells it (api.dfx.swiss/v1/asset) */
  readonly blockchain: string
  /** DFX name of the chain's native asset */
  readonly asset: string
  /** EVM wallets sign the message bytes (personal_sign) */
  readonly isEvm: boolean
}

/**
 * Chains where Edge logs the wallet into DFX before opening the webview.
 * Other DFX chains (Solana, Monero) open the plain deep link.
 */
export const DFX_SESSION_CHAINS: Readonly<Record<string, DfxChain>> = {
  bitcoin: { blockchain: 'Bitcoin', asset: 'BTC', isEvm: false },
  ethereum: { blockchain: 'Ethereum', asset: 'ETH', isEvm: true },
  arbitrum: { blockchain: 'Arbitrum', asset: 'ETH', isEvm: true },
  optimism: { blockchain: 'Optimism', asset: 'ETH', isEvm: true },
  polygon: { blockchain: 'Polygon', asset: 'POL', isEvm: true },
  base: { blockchain: 'Base', asset: 'ETH', isEvm: true },
  binancesmartchain: {
    blockchain: 'BinanceSmartChain',
    asset: 'BNB',
    isEvm: true
  }
}

export interface DfxSessionParams {
  readonly direction: 'buy' | 'sell'
  readonly wallet: EdgeCurrencyWallet
  /** Partner wallet name DFX attributes the user to */
  readonly walletName: string
}

/**
 * Signs DFX's ownership message with the wallet and returns the webview query
 * that opens DFX logged in with the wallet's address and asset preselected.
 * Returns undefined when the chain has no session login or any step fails,
 * so the caller opens the plain deep link instead.
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
    console.warn(
      `DFX session login failed, opening plain link: ${String(error)}`
    )
    return undefined
  }
}

async function loginToDfx(
  params: DfxSessionParams,
  chain: DfxChain
): Promise<Record<string, string>> {
  const { direction, wallet, walletName } = params
  const address = await getDfxAddress(wallet)

  const signResponse = await fetch(
    `${DFX_API_URL}/auth/signMessage?address=${encodeURIComponent(address)}`
  )
  if (!signResponse.ok) {
    throw new Error(`signMessage returned ${signResponse.status}`)
  }
  const { message, blockchains } = asDfxSignMessageResponse(
    await signResponse.text()
  )
  if (!blockchains.includes(chain.blockchain)) {
    throw new Error(`address not accepted on ${chain.blockchain}`)
  }

  // UTXO wallets sign the literal message: `signBytes` would base64 it
  // first and DFX would verify a signature over the wrong data.
  const signature = chain.isEvm
    ? await wallet.signBytes(utf8.parse(message))
    : // eslint-disable-next-line @typescript-eslint/no-deprecated
      await wallet.signMessage(message, {
        otherParams: { publicAddress: address }
      })

  const authResponse = await fetch(`${DFX_API_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, wallet: walletName })
  })
  if (!authResponse.ok) {
    throw new Error(
      `auth returned ${authResponse.status}: ${await authResponse.text()}`
    )
  }
  const { accessToken } = asDfxAuthResponse(await authResponse.text())

  return {
    session: accessToken,
    blockchain: chain.blockchain,
    [direction === 'buy' ? 'asset-out' : 'asset-in']: chain.asset
  }
}

/** Prefers the segwit receive address on UTXO wallets. */
async function getDfxAddress(wallet: EdgeCurrencyWallet): Promise<string> {
  const addresses = await wallet.getAddresses({ tokenId: null })
  const address =
    addresses.find(item => item.addressType === 'segwitAddress') ?? addresses[0]
  if (address == null) throw new Error('wallet has no receive address')
  return address.publicAddress
}
