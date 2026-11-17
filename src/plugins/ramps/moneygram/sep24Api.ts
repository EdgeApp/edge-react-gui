import { asMaybe, type Cleaner } from 'cleaners'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import URL from 'url-parse'

import {
  type AnchorEndpoints,
  asSep24Error,
  asSep24Info,
  asSep24Interactive,
  asSep24TransactionResponse,
  type Sep24Info,
  type Sep24Transaction
} from './moneygramTypes'
import { fetchWithSep10 } from './sep10'

/** Statuses after which the anchor will not change the transfer again. */
const TERMINAL_STATUSES = new Set([
  'completed',
  'refunded',
  'expired',
  'error',
  'no_market',
  'too_small',
  'too_large'
])

export const isTerminalStatus = (status: string): boolean =>
  TERMINAL_STATUSES.has(status)

export interface Sep24StartParams {
  kind: 'deposit' | 'withdraw'
  assetCode: string
  /** Pins the token's issuer, so the anchor cannot pick another one. */
  assetIssuer?: string
  account: string
  amount?: string
  lang?: string
}

export interface Sep24Api {
  startInteractive: (
    params: Sep24StartParams
  ) => Promise<{ id: string; url: string }>
  getTransaction: (id: string) => Promise<Sep24Transaction>
}

/** Reads the anchor's assets and limits, which needs no login. */
export async function fetchSep24Info(
  transferServer: string
): Promise<Sep24Info> {
  const response = await fetch(`${transferServer}/info`)
  return await readJson(response, asSep24Info, 'SEP-24 info')
}

export function makeSep24Api(
  wallet: EdgeCurrencyWallet,
  anchor: AnchorEndpoints
): Sep24Api {
  const baseUrl = anchor.transferServerSep24

  return {
    async startInteractive(params) {
      const {
        kind,
        assetCode,
        assetIssuer,
        account,
        amount,
        lang = 'en'
      } = params
      const body: Record<string, string> = {
        asset_code: assetCode,
        account,
        lang
      }
      if (assetIssuer != null) body.asset_issuer = assetIssuer
      if (amount != null) body.amount = amount

      const response = await fetchWithSep10(
        wallet,
        anchor,
        `${baseUrl}/transactions/${kind}/interactive`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      )
      const { id, url } = await readJson(
        response,
        asSep24Interactive,
        `SEP-24 ${kind}`
      )
      checkInteractiveUrl(url, anchor)
      return { id, url }
    },

    async getTransaction(id) {
      const response = await fetchWithSep10(
        wallet,
        anchor,
        `${baseUrl}/transaction?id=${encodeURIComponent(id)}`
      )
      const { transaction } = await readJson(
        response,
        asSep24TransactionResponse,
        'SEP-24 transaction'
      )
      return transaction
    }
  }
}

/**
 * Hosts that serve an anchor's interactive pages outside its home domain,
 * keyed by home domain. Each one is listed by name, since trusting the
 * whole parent zone would also trust every sibling host in it.
 */
const ANCHOR_UI_HOSTS: Record<string, string[]> = {
  'testanchor.stellar.org': ['anchor-ref-ui-testanchor.stellar.org']
}

/** True for the home domain itself or any host under it. */
export const isHomeDomainHost = (
  hostname: string,
  homeDomain: string
): boolean => hostname === homeDomain || hostname.endsWith(`.${homeDomain}`)

/**
 * True for an https URL on the anchor's home domain, a host under it, or
 * one of the anchor's listed UI hosts.
 */
export function isAnchorUrl(url: string, anchor: AnchorEndpoints): boolean {
  const { hostname, protocol } = new URL(url)
  if (protocol !== 'https:') return false
  const uiHosts = ANCHOR_UI_HOSTS[anchor.homeDomain] ?? []
  return (
    isHomeDomainHost(hostname, anchor.homeDomain) || uiHosts.includes(hostname)
  )
}

/**
 * Refuses an interactive URL that is not an anchor URL, so a bad transfer
 * server answer cannot open some other page in the in-app browser.
 */
export function checkInteractiveUrl(
  url: string,
  anchor: AnchorEndpoints
): void {
  if (!isAnchorUrl(url, anchor)) {
    throw new Error(`SEP-24 interactive URL is not on the anchor: ${url}`)
  }
}

/**
 * The anchor's status page for a transfer, if it passes the same check as
 * the interactive URL. The app saves it on the wallet transaction and opens
 * it from the transaction details, so anything else is dropped.
 */
export function anchorPageUrl(
  url: string | undefined,
  anchor: AnchorEndpoints
): string | undefined {
  if (url == null) return
  try {
    checkInteractiveUrl(url, anchor)
    return url
  } catch (error: unknown) {
    console.warn('MoneyGram: dropping the anchor status page', error)
  }
}

async function readJson<T>(
  response: Response,
  cleaner: Cleaner<T>,
  label: string
): Promise<T> {
  const json: unknown = await response.json().catch(() => undefined)
  if (!response.ok) {
    const anchorError = asMaybe(asSep24Error)(json)?.error
    const reason =
      anchorError == null
        ? String(response.status)
        : `${response.status} ${anchorError}`
    throw new Error(`${label} request failed: ${reason}`)
  }
  return cleaner(json)
}
