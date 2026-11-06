import { gt, lt } from 'biggystring'
import { asMaybe, asObject, asString } from 'cleaners'
import type { EdgeTokenId, EdgeTokenMap } from 'edge-core-js'

import { showError } from '../../../components/services/AirshipInstance'
import { EDGE_CONTENT_SERVER_URI } from '../../../constants/CdnConstants'
import { lstrings } from '../../../locales/strings'
import { removeIsoPrefix } from '../../../util/utils'
import { FiatProviderError } from '../../gui/fiatProviderTypes'
import type {
  RampApproveQuoteParams,
  RampCheckSupportRequest,
  RampPlugin,
  RampPluginConfig,
  RampPluginFactory,
  RampQuote,
  RampQuoteRequest,
  RampSupportResult,
  SettlementRange
} from '../rampPluginTypes'
import { createStore } from '../utils/createStore'
import { getRampPluginStoreId } from '../utils/rampStoreIds'
import { openEdgeWebView } from '../utils/webViewUtils'
import { loadOpenTransfers, saveTransfer } from './moneygramStore'
import {
  MONEYGRAM_DISPLAY_NAME,
  MONEYGRAM_PLUGIN_ID,
  type TransferContext,
  watchTransfer
} from './moneygramTransfer'
import { activateTokenForDeposit } from './moneygramTrustline'
import {
  type AnchorCurrency,
  type AnchorEndpoints,
  type AnchorToml,
  asInitOptions,
  type MoneygramTransfer,
  type Sep24AssetInfo,
  type Sep24Info
} from './moneygramTypes'
import { fetchAnchorToml } from './sep1'
import { getStellarAccount } from './sep10'
import {
  fetchSep24Info,
  isAnchorUrl,
  isTerminalStatus,
  makeSep24Api
} from './sep24Api'

const partnerIcon = `${EDGE_CONTENT_SERVER_URI}/moneygram.png`

/** The network each supported wallet type signs for. */
export const NETWORK_PASSPHRASES: Record<string, string> = {
  stellar: 'Public Global Stellar Network ; September 2015',
  stellartestnet: 'Test SDF Network ; September 2015'
}

// SEP-24 names the chain's own asset "native":
const NATIVE_ASSET_CODE = 'native'

// Where a Stellar token lives, as the wallet's token list describes it:
const asStellarTokenLocation = asObject({
  code: asString,
  issuer: asString
})

const SETTLEMENT_RANGE: SettlementRange = {
  min: { value: 10, unit: 'minutes' },
  max: { value: 1, unit: 'days' }
}

// An abandoned transfer stays "incomplete" until the anchor expires it,
// and a deposit's payout may never show up in the wallet's history,
// so resume stops checking on those after a day:
const STALE_RESUME_MS = 24 * 60 * 60 * 1000

export const moneygramRampPlugin: RampPluginFactory = config => {
  const { homeDomain } = asInitOptions(config.initOptions)
  const { account, navigation, onLogEvent, store } = config
  const context: TransferContext = { account, navigation, onLogEvent, store }

  // The anchor's stellar.toml and /info, fetched once per plugin instance:
  let tomlPromise: Promise<AnchorToml> | undefined
  let infoPromise: Promise<Sep24Info> | undefined

  const getToml = async (): Promise<AnchorToml> => {
    if (tomlPromise == null) {
      const promise = fetchAnchorToml(homeDomain)
      tomlPromise = promise
      promise.catch(() => {
        if (tomlPromise === promise) tomlPromise = undefined
      })
    }
    return await tomlPromise
  }

  const getAnchor = async (): Promise<AnchorEndpoints> => {
    const { signingKey, transferServerSep24, webAuthEndpoint } = await getToml()
    return { homeDomain, signingKey, transferServerSep24, webAuthEndpoint }
  }

  const getInfo = async (): Promise<Sep24Info> => {
    if (infoPromise == null) {
      const promise = getToml().then(
        async toml => await fetchSep24Info(toml.transferServerSep24)
      )
      infoPromise = promise
      promise.catch(() => {
        if (infoPromise === promise) infoPromise = undefined
      })
    }
    return await infoPromise
  }

  /**
   * The anchor's asset and limits for this wallet asset, if the wallet and
   * anchor share the network and the anchor handles the asset.
   */
  const getAnchorAsset = async (
    pluginId: string,
    tokenId: EdgeTokenId,
    direction: 'buy' | 'sell'
  ): Promise<
    { asset: AnchorCurrency; assetInfo: Sep24AssetInfo } | undefined
  > => {
    const passphrase = NETWORK_PASSPHRASES[pluginId]
    if (passphrase == null) return

    const toml = await getToml()
    if (toml.networkPassphrase !== passphrase) return

    const allTokens = account.currencyConfig[pluginId]?.allTokens ?? {}
    const asset = findAnchorAsset(toml.currencies, allTokens, tokenId)
    if (asset == null) return

    const info = await getInfo()
    const assetInfo =
      direction === 'buy' ? info.deposit[asset.code] : info.withdraw[asset.code]
    if (!assetInfo?.enabled) return
    return { asset, assetInfo }
  }

  const checkSupport = async (
    request: RampCheckSupportRequest
  ): Promise<RampSupportResult> => {
    const { cryptoAsset, direction } = request
    try {
      const asset = await getAnchorAsset(
        cryptoAsset.pluginId,
        cryptoAsset.tokenId,
        direction
      )
      if (asset == null) return { supported: false }
      // The anchor prices the transfer on its own page, so the amount is
      // always entered in crypto:
      return { supported: true, supportedAmountTypes: ['crypto'] }
    } catch (error: unknown) {
      console.warn('MoneyGram: checkSupport failed', error)
      return { supported: false }
    }
  }

  const fetchQuotes = async (
    request: RampQuoteRequest
  ): Promise<RampQuote[]> => {
    const {
      amountQuery,
      amountType,
      direction,
      displayCurrencyCode,
      regionCode,
      tokenId,
      wallet
    } = request
    if (amountType !== 'crypto') return []

    const anchorAsset = await getAnchorAsset(
      wallet.currencyInfo.pluginId,
      tokenId,
      direction
    )
    if (anchorAsset == null) return []
    const { asset, assetInfo } = anchorAsset
    const { code: assetCode, issuer: assetIssuer } = asset

    const cryptoAmount = pickAmount(amountQuery, assetInfo)
    checkLimits(cryptoAmount, assetInfo, displayCurrencyCode)
    const fiatCurrencyCode = removeIsoPrefix(request.fiatCurrencyCode)

    const approveQuote = async (
      params: RampApproveQuoteParams
    ): Promise<void> => {
      const { coreWallet } = params
      // A deposit of a token needs the wallet's trustline before the
      // anchor can pay it:
      if (direction === 'buy' && tokenId != null) {
        const activated = await activateTokenForDeposit(
          account,
          coreWallet,
          tokenId
        )
        if (!activated) return
      }

      const anchor = await getAnchor()
      const api = makeSep24Api(coreWallet, anchor)
      const { id, url } = await api.startInteractive({
        kind: direction === 'buy' ? 'deposit' : 'withdraw',
        assetCode,
        assetIssuer,
        account: await getStellarAccount(coreWallet),
        amount: cryptoAmount
      })

      const transfer: MoneygramTransfer = {
        id,
        direction,
        walletId: coreWallet.id,
        tokenId,
        assetCode,
        fiatCurrencyCode,
        status: 'incomplete',
        createdAt: new Date().toISOString(),
        sendTxid: undefined,
        taggedTxid: undefined,
        anchor
      }
      await saveTransfer(store, transfer)

      // The anchor's page collects the user's details, then the poller
      // takes over from the status it reports:
      let webViewOpen = true
      openEdgeWebView({
        navigation,
        url,
        // Later page loads stay on the hosts the first URL had to pass:
        onShouldStartLoad: pageUrl => isAnchorUrl(pageUrl, anchor),
        onClose: () => {
          webViewOpen = false
        }
      })
      watchTransfer(context, transfer, {
        askBeforeSend: () => !webViewOpen,
        closeWebView: () => {
          if (!webViewOpen) return
          webViewOpen = false
          navigation.pop()
        }
      }).catch((error: unknown) => {
        showError(error)
      })
    }

    const quote: RampQuote = {
      pluginId: MONEYGRAM_PLUGIN_ID,
      partnerIcon,
      pluginDisplayName: MONEYGRAM_DISPLAY_NAME,
      displayCurrencyCode,
      // MoneyGram shows the cash amount and fees on its own page. Both
      // amounts stay '0' so ranking treats this as an unpriced placeholder
      // rather than a zero rate (approveQuote still sends the real amount):
      cryptoAmount: '0',
      isEstimate: true,
      fiatCurrencyCode,
      fiatAmount: '0',
      direction,
      regionCode,
      paymentType: 'cash',
      settlementRange: SETTLEMENT_RANGE,
      specialQuoteRateMessage: lstrings.tap_to_view_quote_amount_and_rate,
      approveQuote,
      closeQuote: async () => {}
    }
    return [quote]
  }

  const plugin: RampPlugin = {
    pluginId: MONEYGRAM_PLUGIN_ID,
    rampInfo: { partnerIcon, pluginDisplayName: MONEYGRAM_DISPLAY_NAME },
    checkSupport,
    fetchQuotes
  }
  return plugin
}

/**
 * The anchor's SEP-24 asset for a wallet asset. A token only matches when
 * the anchor's stellar.toml lists the same code from the same issuer, and
 * the issuer goes to the anchor with the code, so a look-alike asset from
 * another issuer never reaches the anchor.
 */
export function findAnchorAsset(
  currencies: AnchorCurrency[],
  allTokens: EdgeTokenMap,
  tokenId: EdgeTokenId
): AnchorCurrency | undefined {
  if (tokenId == null) return { code: NATIVE_ASSET_CODE }
  const location = asMaybe(asStellarTokenLocation)(
    allTokens[tokenId]?.networkLocation
  )
  if (location == null) return
  const listed = currencies.some(
    currency =>
      currency.code === location.code && currency.issuer === location.issuer
  )
  return listed ? location : undefined
}

/** Stellar amounts have 7 decimal places; avoids exponent notation. */
const toDecimal = (amount: number): string =>
  amount.toFixed(7).replace(/\.?0+$/, '')

/** Turns the amount request into the exact amount to send the anchor. */
export function pickAmount(
  amountQuery: RampQuoteRequest['amountQuery'],
  assetInfo: Sep24AssetInfo
): string {
  const max =
    assetInfo.max_amount == null ? undefined : toDecimal(assetInfo.max_amount)
  if ('exchangeAmount' in amountQuery) return amountQuery.exchangeAmount
  if ('maxExchangeAmount' in amountQuery) {
    const { maxExchangeAmount } = amountQuery
    return max != null && gt(maxExchangeAmount, max) ? max : maxExchangeAmount
  }
  if (max == null) {
    throw new Error('MoneyGram has no maximum amount for this asset')
  }
  return max
}

/** Throws the quote scene's limit errors for amounts outside /info. */
export function checkLimits(
  amount: string,
  assetInfo: Sep24AssetInfo,
  displayCurrencyCode: string
): void {
  const { min_amount: min, max_amount: max } = assetInfo
  if (min != null && lt(amount, toDecimal(min))) {
    throw new FiatProviderError({
      providerId: MONEYGRAM_PLUGIN_ID,
      errorType: 'underLimit',
      errorAmount: min,
      displayCurrencyCode
    })
  }
  if (max != null && gt(amount, toDecimal(max))) {
    throw new FiatProviderError({
      providerId: MONEYGRAM_PLUGIN_ID,
      errorType: 'overLimit',
      errorAmount: max,
      displayCurrencyCode
    })
  }
}

/**
 * Picks up saved MoneyGram transfers the anchor has not finished, such as a
 * withdraw still waiting for its payment, and follows them to the end.
 */
export async function resumeMoneygramTransfers(
  config: Pick<RampPluginConfig, 'account' | 'navigation' | 'onLogEvent'>
): Promise<void> {
  const { account, navigation, onLogEvent } = config
  const store = createStore(
    getRampPluginStoreId(MONEYGRAM_PLUGIN_ID),
    account.dataStore
  )
  const context: TransferContext = { account, navigation, onLogEvent, store }

  const transfers = await loadOpenTransfers(store)
  for (const transfer of transfers) {
    const age = Date.now() - new Date(transfer.createdAt).valueOf()
    const mayBeStale =
      transfer.status === 'incomplete' || isTerminalStatus(transfer.status)
    if (mayBeStale && age > STALE_RESUME_MS) continue
    watchTransfer(context, transfer, { askBeforeSend: () => true }).catch(
      (error: unknown) => {
        console.warn(`MoneyGram: resuming ${transfer.id} failed`, error)
      }
    )
  }
}
