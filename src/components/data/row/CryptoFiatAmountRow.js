// @flow

import { div, mul } from 'biggystring'
import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useTokenDisplayData } from '../../../hooks/useTokenDisplayData'
import { memo, useMemo } from '../../../types/reactHooks'
import { DECIMAL_PRECISION } from '../../../util/utils'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FiatIcon } from '../../icons/FiatIcon'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText.js'
import { EdgeText } from '../../themed/EdgeText.js'

type Props = {|
  nativeFiatAmount: string,
  tokenId: string,
  wallet: EdgeCurrencyWallet
|}

// -----------------------------------------------------------------------------
// A row of data with crypto on the left and fiat on the right. Currently
// supports only an input amount of native fiat and a conversion to some token.
// -----------------------------------------------------------------------------
const CryptoFiatAmountRowComponent = (props: Props) => {
  const { nativeFiatAmount, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const walletId = wallet.id
  const token = wallet.currencyConfig.allTokens[tokenId]
  const { denominations } = token
  const tokenExchangeMultiplier = denominations[0].multiplier

  const { assetToFiatRate: tokenFiatRate } = useTokenDisplayData({
    tokenId,
    wallet
  })

  /**
   * Convert between native fiat amount and native crypto amount:
   *   nativeFiatAmount = (nativeCryptoAmount / cryptoExchangeMultiplier) * tokenFiatRate
   *   nativeCryptoAmount = cryptoExchangeMultiplier * (nativeFiatAmount / tokenFiatRate)
   */
  const nativeTokenAmount = useMemo(() => {
    const ret = mul(tokenExchangeMultiplier, div(nativeFiatAmount, tokenFiatRate, DECIMAL_PRECISION))
    return ret
  }, [tokenExchangeMultiplier, nativeFiatAmount, tokenFiatRate])

  // Use nativeTokenAmount in both fiat and crypto display fields because they properly handle any user/locale settings.
  return (
    <View style={styles.spacedContainer}>
      <View style={styles.halfContainer}>
        <CryptoIcon sizeRem={1.5} marginRem={[0.5, 0.25, 0.5, 0.5]} tokenId={tokenId} walletId={walletId} />
        {/* Extra view to make text respect bounds of outer halfContainer */}
        <View style={styles.halfContainer}>
          <EdgeText style={styles.text}>
            <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={nativeTokenAmount} />
          </EdgeText>
        </View>
      </View>

      <View style={styles.halfContainer}>
        <FiatIcon sizeRem={1.5} marginRem={[0.5, 0.25, 0.5, 0.5]} fiatCurrencyCode={wallet.fiatCurrencyCode} />
        {/* Make text respect bounds of outer half container */}
        <View style={styles.halfContainer}>
          <EdgeText style={styles.text}>
            <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeTokenAmount} tokenId={tokenId} wallet={wallet} />
          </EdgeText>
        </View>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  spacedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1
  },
  halfContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row'
  },
  text: {
    fontFamily: theme.fontFaceMedium,
    marginLeft: theme.rem(0.25)
  }
}))

export const CryptoFiatAmountRow = memo(CryptoFiatAmountRowComponent)
