import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useSelector } from '../../types/reactRedux'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { CryptoText } from '../text/CryptoText'
import { FiatText } from '../text/FiatText'
import { EdgeText } from '../themed/EdgeText'

// For display of custom assets such as AAVE collateral tokens
export interface CustomAsset {
  displayName: string
  currencyCode: string
  // TODO: Update after hidden assets are supported in accountbased
  nativeBalance: string
  // Token referenced for its exchange rate and icon
  referenceTokenId: string
  wallet: EdgeCurrencyWallet
}

interface Props {
  customAsset: CustomAsset
  marginRem?: number[] | number
}

/**
 * A view representing the data from a custom asset, used for rows, cards, etc.
 */
const CustomAssetRowComponent: React.FC<Props> = (props: Props) => {
  const { customAsset, marginRem } = props
  const { wallet, referenceTokenId, displayName, currencyCode, nativeBalance } =
    customAsset
  const { pluginId } = wallet.currencyInfo
  const { showTokenNames = false } = SPECIAL_CURRENCY_INFO[pluginId] ?? {}
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))

  // Balance stuff:
  const showBalance = useSelector(
    state => state.ui.settings.isAccountBalanceVisible
  )
  const cryptoText = showBalance ? (
    <CryptoText
      wallet={wallet}
      tokenId={referenceTokenId}
      nativeAmount={nativeBalance}
      withSymbol
    />
  ) : null
  const fiatText = showBalance ? (
    <FiatText
      nativeCryptoAmount={nativeBalance}
      tokenId={referenceTokenId}
      currencyConfig={wallet.currencyConfig}
      style={styles.rightSubText}
    />
  ) : null

  const icon = (
    <CryptoIcon sizeRem={2} tokenId={referenceTokenId} pluginId={pluginId} />
  )

  let displayCurrencyCode = currencyCode
  const tokenFromId = wallet.currencyConfig.allTokens[referenceTokenId]
  if (showTokenNames && tokenFromId != null) {
    displayCurrencyCode = tokenFromId.displayName
  }

  return (
    <View style={[styles.container, margin]}>
      {icon}
      <View style={styles.leftColumn}>
        <View style={styles.row}>
          <EdgeText accessible style={styles.leftText}>
            {displayCurrencyCode}
          </EdgeText>
        </View>
        <EdgeText accessible style={styles.leftSubtext}>
          {displayName}
        </EdgeText>
      </View>
      <View style={styles.rightColumn}>
        {cryptoText ?? null}
        <View accessible style={styles.row}>
          {fiatText ?? null}
        </View>
      </View>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout copied from IconDataRow to avoid extra wrapper component
  rightColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column'
  },
  leftColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.25),
    marginLeft: theme.rem(0.5)
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  // Text:
  rightSubText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  leftText: {
    fontFamily: theme.fontFaceMedium
  },
  leftSubtext: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const CustomAssetRow = React.memo(CustomAssetRowComponent)
