import { div, mul } from 'biggystring'
import { EdgeCurrencyConfig, EdgeDenomination, EdgeTokenId } from 'edge-core-js'

import { RootState } from '../reducers/RootReducer'
import { convertCurrency } from '../selectors/WalletSelectors'
import { asBiggystring } from './cleaners'
import { getTokenId } from './CurrencyInfoHelpers'
import { DECIMAL_PRECISION, mulToPrecision } from './utils'

/**
 * Defines base properties for the CryptoAmount asset configuration.
 */
interface AssetBaseArgs {
  currencyConfig: EdgeCurrencyConfig
}

/**
 * Specifies that one of tokenId or currencyCode must be provided. To describe a
 * mainnet/parent/chain currency, an explicit null must be provided to tokenId
 * or currencyCode.
 */
type TokenOrCurrencyCodeArgs =
  | {
      tokenId: EdgeTokenId
      currencyCode?: never
    }
  | {
      tokenId?: never
      currencyCode: string
    }

// Specifies that one of exchangeAmount or nativeAmount must be provided.
type ExchangeOrNativeAmountArgs =
  | {
      exchangeAmount: number | string
      nativeAmount?: never
    }
  | {
      exchangeAmount?: never
      nativeAmount: string
    }

// Combines both requirements.
type CryptoAmountConstructorArgs = AssetBaseArgs & TokenOrCurrencyCodeArgs & ExchangeOrNativeAmountArgs

/**
 * One-stop shop for any information pertaining to a crypto asset.
 * Pass whatever you happen to have, get what you need.
 *
 * Usage:
 * const ethAmountWithExchange = new CryptoAmount({
 *   currencyConfig, // 'ethereum'
 *   tokenId: null,
 *   exchangeAmount: '100',
 * })
 *
 * const cryptoAmountWithNative = new CryptoAmount({
 *   currencyConfig,
 *   currencyCode: 'USDC',
 *   nativeAmount: '12345678',
 * })
 *
 * cryptoAmount.getDollarValue()
 */
export class CryptoAmount {
  public readonly currencyConfig: EdgeCurrencyConfig
  public readonly nativeAmount: string
  public readonly tokenId: EdgeTokenId

  /**
   * Must construct CryptoAmount with currencyConfig and one of either: tokenId or currencyCode
   */
  public constructor(args: CryptoAmountConstructorArgs) {
    const { currencyCode, currencyConfig, exchangeAmount, nativeAmount, tokenId } = args
    this.currencyConfig = currencyConfig

    // Populate tokenId, derived from currencyCode
    if (currencyCode != null) {
      // Ensure currencyCode is recognized, if given as a constructor argument.
      const foundTokenId = getTokenId(currencyConfig, currencyCode)
      if (foundTokenId === undefined) {
        throw new Error(`CryptoAmount: Could not find tokenId for currencyCode: ${currencyCode}, pluginId: ${currencyConfig.currencyInfo.pluginId}.`)
      } else {
        this.tokenId = foundTokenId
      }
    } else {
      this.tokenId = tokenId
    }

    // Populate nativeAmount
    if (exchangeAmount != null) {
      try {
        asBiggystring(exchangeAmount.toString())
      } catch (e) {
        throw new Error(`CryptoAmount: Error instantiating with exchangeAmount: ${String(e)}\n${JSON.stringify(args)}`)
      }

      this.nativeAmount = mul(this.getExchangeDenom().multiplier, exchangeAmount.toString())
      if (this.nativeAmount.includes('.')) {
        this.nativeAmount = this.nativeAmount.split('.')[0]
      }
    } else {
      this.nativeAmount = nativeAmount
    }
  }

  //
  // Getters:
  //

  /**
   * Mainnet, parent, network or chain currency code.
   */
  get chainCode(): string {
    return this.currencyConfig.currencyInfo.currencyCode
  }

  /**
   * If this CryptoAmount is about a token, the currency code for that token.
   * Else, the mainnet, parent, network or chain code.
   */
  get currencyCode(): string {
    const { currencyCode } = this.tokenId == null ? this.currencyConfig.currencyInfo : this.currencyConfig.allTokens[this.tokenId]
    return currencyCode
  }

  /**
   * The decimal amount you would see on exchanges and pretty much anywhere
   * else. Given in maximum decimal precision.
   *
   * If typical app precision or a specific precision is required, use
   * getExchangeAmount() instead.
   */
  get exchangeAmount(): string {
    const { multiplier } = this.getExchangeDenom()
    return div(this.nativeAmount, multiplier, DECIMAL_PRECISION)
  }

  /**
   * Core pluginId associated with this currency
   */
  get pluginId(): string {
    return this.currencyConfig.currencyInfo.pluginId
  }

  //
  // Utilities:
  //

  /**
   * Automatically uses 2 decimal/cent places if unspecified.
   */
  displayDollarValue(state: RootState, precision?: number): string {
    return this.displayFiatValue(state, 'iso:USD', precision)
  }

  /**
   * Automatically uses 2 decimal/cent places if unspecified.
   */
  displayFiatValue(state: RootState, isoFiatCode: string, precision?: number) {
    return parseFloat(convertCurrency(state, this.currencyCode, isoFiatCode, this.exchangeAmount)).toFixed(precision ?? 2)
  }

  /**
   * The amount you would see on exchanges and pretty much anywhere else. If
   * precision is unset, precision is dynamically set according to the asset's
   * multiplier.
   */
  getExchangeAmount(precision?: number): string {
    const { multiplier } = this.getExchangeDenom()
    return div(this.nativeAmount, multiplier, precision ?? mulToPrecision(multiplier))
  }

  getExchangeDenom(): EdgeDenomination {
    const { allTokens, currencyInfo } = this.currencyConfig
    return this.tokenId == null ? currencyInfo.denominations[0] : allTokens[this.tokenId].denominations[0]
  }
}
