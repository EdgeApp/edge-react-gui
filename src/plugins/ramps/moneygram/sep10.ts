import { asString } from 'cleaners'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import URL from 'url-parse'

import {
  type AnchorEndpoints,
  asSep10Challenge,
  asSep10Token
} from './moneygramTypes'

/** The wallet's Stellar account, which SEP-10 authenticates. */
export async function getStellarAccount(
  wallet: EdgeCurrencyWallet
): Promise<string> {
  const [address] = await wallet.getAddresses({ tokenId: null })
  if (address == null) throw new Error('Stellar wallet has no address')
  return address.publicAddress
}

/**
 * Runs SEP-10 web authentication: fetch the anchor's challenge, have the
 * Stellar engine validate and sign it with the wallet key, and trade the
 * signed challenge for a JWT.
 */
export async function fetchSep10Token(
  wallet: EdgeCurrencyWallet,
  anchor: AnchorEndpoints
): Promise<string> {
  const { homeDomain, signingKey, webAuthEndpoint } = anchor
  const account = await getStellarAccount(wallet)

  const query = `account=${encodeURIComponent(
    account
  )}&home_domain=${encodeURIComponent(homeDomain)}`
  const challengeResponse = await fetch(`${webAuthEndpoint}?${query}`)
  if (!challengeResponse.ok) {
    throw new Error(`SEP-10 challenge failed: ${challengeResponse.status}`)
  }
  const challenge = asSep10Challenge(await challengeResponse.json())

  const signed = asString(
    await wallet.otherMethods.signSep10Challenge(challenge.transaction, {
      homeDomain,
      webAuthDomain: new URL(webAuthEndpoint).host,
      serverSigningKey: signingKey
    })
  )

  const tokenResponse = await fetch(webAuthEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signed })
  })
  if (!tokenResponse.ok) {
    throw new Error(`SEP-10 token request failed: ${tokenResponse.status}`)
  }
  return asSep10Token(await tokenResponse.json()).token
}

// JWTs shared by every transfer for the same wallet and anchor:
const tokenCache = new Map<string, Promise<string>>()

/**
 * Fetches with the anchor's JWT, authenticating on first use and once more
 * if the anchor answers 401 (an expired or revoked token).
 */
export async function fetchWithSep10(
  wallet: EdgeCurrencyWallet,
  anchor: AnchorEndpoints,
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  // The key holds every endpoint and key the login trusted, so a token
  // only ever goes back to the servers of the anchor that issued it:
  const key = [
    wallet.id,
    anchor.homeDomain,
    anchor.webAuthEndpoint,
    anchor.signingKey,
    anchor.transferServerSep24
  ].join(' ')

  const getToken = async (refresh: boolean): Promise<string> => {
    let pending = tokenCache.get(key)
    if (pending == null || refresh) {
      pending = fetchSep10Token(wallet, anchor)
      tokenCache.set(key, pending)
      // A failed login must not stay cached:
      pending.catch(() => {
        if (tokenCache.get(key) === pending) tokenCache.delete(key)
      })
    }
    return await pending
  }

  const send = async (token: string): Promise<Response> =>
    await fetch(url, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        Authorization: `Bearer ${token}`
      }
    })

  const response = await send(await getToken(false))
  if (response.status !== 401) return response
  return await send(await getToken(true))
}
