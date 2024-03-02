import { div, mul } from 'biggystring'
import { EdgeCurrencyConfig, EdgeDenomination } from 'edge-core-js'

import { RootState } from '../reducers/RootReducer'
import { emptyEdgeDenomination } from '../selectors/DenominationSelectors'
import { convertCurrency } from '../selectors/WalletSelectors'
import { asBiggystring } from './cleaners'
import { DECIMAL_PRECISION, mulToPrecision } from './utils'

// Defines base properties for asset configuration.
interface AssetBaseArgs {
  currencyConfig: EdgeCurrencyConfig
}

// Specifies that one of tokenId or currencyCode must be provided, or neither.
type TokenOrCurrencyCodeArgs =
  | {
      tokenId: string
      currencyCode?: never
    }
  | {
      tokenId?: never
      currencyCode: string
    }
  | {
      tokenId?: never
      currencyCode?: never
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
 * const cryptoAmountWithExchange = CryptoAmount.createWithExchangeAmount({
 *   currencyConfig,
 *   exchangeAmount: '100',
 * })
 *
 * const cryptoAmountWithNative = CryptoAmount.createWithNativeAmount({
 *   currencyCode: 'USDC',
 *   nativeAmount: '12345678',
 * })
 */
export class CryptoAmount {
  public readonly currencyConfig: EdgeCurrencyConfig
  public readonly nativeAmount: string
  public readonly tokenId: string | null

  public constructor(args: CryptoAmountConstructorArgs) {
    const { currencyCode, currencyConfig, exchangeAmount, nativeAmount, tokenId } = args
    this.currencyConfig = currencyConfig

    // Populate tokenId
    if (currencyCode != null) {
      // Ensure currencyCode is recognized, if given as a constructor argument.
      const foundTokenId = Object.keys(currencyConfig.allTokens).find(edgeToken => currencyConfig.allTokens[edgeToken].currencyCode === currencyCode)
      if (foundTokenId == null) {
        throw new Error(`CryptoAmount: Could not find tokenId for currencyCode: ${currencyCode}, pluginId: ${currencyConfig.currencyInfo.pluginId}.`)
      } else {
        this.tokenId = foundTokenId
      }
    } else {
      this.tokenId = tokenId ?? null
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

  get chainCode(): string {
    return this.currencyConfig.currencyInfo.currencyCode
  }

  get currencyCode(): string {
    const { currencyCode } = this.tokenId == null ? this.currencyConfig.currencyInfo : this.currencyConfig.allTokens[this.tokenId]
    return currencyCode
  }

  get exchangeAmount(): string {
    const { multiplier } = this.getExchangeDenom()
    return div(this.nativeAmount, multiplier, DECIMAL_PRECISION)
  }

  get pluginId(): string {
    return this.currencyConfig.currencyInfo.pluginId
  }

  //
  // Utilities:
  //

  displayDollarValue(state: RootState, precision?: number): string {
    return parseFloat(convertCurrency(state, this.currencyCode, 'iso:USD', this.exchangeAmount)).toFixed(precision ?? 2)
  }

  displayFiatValue(state: RootState, isoFiatCode: string, precision?: number) {
    return parseFloat(convertCurrency(state, this.currencyCode, isoFiatCode, this.exchangeAmount)).toFixed(precision ?? 2)
  }

  getExchangeAmount(precision?: number): string {
    const { multiplier } = this.getExchangeDenom()
    return div(this.nativeAmount, multiplier, precision ?? mulToPrecision(multiplier))
  }

  getExchangeDenom(): EdgeDenomination {
    const { allTokens, currencyInfo } = this.currencyConfig

    if (this.tokenId == null) return currencyInfo.denominations[0]
    for (const tokenId of Object.keys(allTokens)) {
      const token = allTokens[tokenId]
      if (token.currencyCode === this.currencyCode) return token.denominations[0]
    }

    return emptyEdgeDenomination
  }
}
