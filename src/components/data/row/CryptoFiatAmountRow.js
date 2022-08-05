// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { memo } from '../../../types/reactHooks'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FiatIcon } from '../../icons/FiatIcon'
import { type Theme, cacheStyles, useTheme } from '../../services/ThemeContext.js'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText.js'
import { EdgeText } from '../../themed/EdgeText.js'

type Props = {|
  nativeAmount: string,
  tokenId?: string,
  wallet: EdgeCurrencyWallet
|}

// -----------------------------------------------------------------------------
// A row of data with crypto on the left and fiat on the right. Currently
// supports only an input amount of native fiat and a conversion to some token.
// -----------------------------------------------------------------------------
const CryptoFiatAmountRowComponent = (props: Props) => {
  const { nativeAmount, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const { pluginId } = wallet.currencyInfo

  // Use nativeAmount in both fiat and crypto display fields because they properly handle any user/locale settings.
  return (
    <View style={styles.container}>
      <View style={styles.columnLeft}>
        <CryptoIcon sizeRem={1.5} tokenId={tokenId} pluginId={pluginId} hideSecondary />
        <EdgeText style={styles.text}>
          <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={nativeAmount} />
        </EdgeText>
      </View>

      <View style={styles.columnRight}>
        <FiatIcon sizeRem={1.5} fiatCurrencyCode={wallet.fiatCurrencyCode} />
        <EdgeText style={styles.text}>
          <FiatText appendFiatCurrencyCode autoPrecision hideFiatSymbol nativeCryptoAmount={nativeAmount} tokenId={tokenId} wallet={wallet} />
        </EdgeText>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1
  },
  columnLeft: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row'
  },
  columnRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row'
  },
  text: {
    fontFamily: theme.fontFaceMedium,
    marginLeft: theme.rem(0.5)
  }
}))

export const CryptoFiatAmountRow = memo(CryptoFiatAmountRowComponent)
