import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { useWalletBalance } from '../../../hooks/useWalletBalance'
import { useWalletName } from '../../../hooks/useWalletName'
import { memo } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { FiatText } from '../../text/FiatText'
import { TickerText } from '../../text/TickerText'
import { EdgeText } from '../../themed/EdgeText'

type Props = {
  marginRem?: number[] | number
  showRate?: boolean
  token?: EdgeToken
  tokenId?: string
  wallet: EdgeCurrencyWallet
}

// -----------------------------------------------------------------------------
// A view representing the data from a wallet, used for rows, cards, etc.
// -----------------------------------------------------------------------------
const CurrencyRowComponent = (props: Props) => {
  const { marginRem, showRate = false, token, tokenId, wallet } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 1), theme.rem))

  // Currency code and wallet name for display:
  const allTokens = wallet.currencyConfig.allTokens
  const tokenFromId = token != null ? token : tokenId == null ? null : allTokens[tokenId]
  const { currencyCode } = tokenFromId == null ? wallet.currencyInfo : tokenFromId
  const name = useWalletName(wallet)

  // Balance stuff:
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const balance = useWalletBalance(wallet, tokenId)

  return (
    <View style={[styles.container, margin]}>
      <CryptoIcon sizeRem={2} tokenId={tokenId} walletId={wallet.id} />
      <View style={styles.nameColumn}>
        <View style={styles.currencyRow}>
          <EdgeText style={styles.currencyText}>{currencyCode}</EdgeText>
          {showRate && wallet != null ? (
            <EdgeText style={styles.exchangeRateText}>
              <TickerText wallet={wallet} tokenId={tokenId} />
            </EdgeText>
          ) : null}
        </View>
        <EdgeText style={styles.nameText}>{name}</EdgeText>
      </View>
      {showBalance ? (
        <View style={styles.balanceColumn}>
          <EdgeText>
            <CryptoText wallet={wallet} tokenId={tokenId} nativeAmount={balance} withSymbol />
          </EdgeText>
          <EdgeText style={styles.fiatBalanceText}>
            <FiatText nativeCryptoAmount={balance} tokenId={tokenId} wallet={wallet} />
          </EdgeText>
        </View>
      ) : null}
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Layout:
  balanceColumn: {
    alignItems: 'flex-end',
    flexDirection: 'column',
    paddingRight: theme.rem(1)
  },
  nameColumn: {
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 1,
    marginRight: theme.rem(0.5),
    marginLeft: theme.rem(1)
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5)
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },

  // Text:
  fiatBalanceText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  currencyText: {
    flexBasis: 'auto',
    flexShrink: 1,
    fontFamily: theme.fontFaceMedium
  },
  exchangeRateText: {
    textAlign: 'left',
    flexBasis: 'auto',
    flexShrink: 1,
    marginLeft: theme.rem(0.75)
  },
  nameText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const CurrencyRow = memo(CurrencyRowComponent)
