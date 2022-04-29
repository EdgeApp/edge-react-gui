// @flow

import * as React from 'react'
import { View } from 'react-native'

import { useFiatText } from '../../hooks/useFiatText.js'
import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { memo, useMemo } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { CryptoText } from '../common/text/CryptoText.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'

type Props = {
  currencyCode: string,
  gradient?: boolean,
  onPress?: (walletId: string, currencyCode: string) => void,
  onLongPress?: () => void,
  showRate?: boolean,
  walletId: string,
  tokenCode?: string,
  walletName?: string
}

/**
 * Renders a WalletListRow with the hide-able balance children.
 */
export const WalletListCurrencyRowComponent = (props: Props) => {
  const { currencyCode, showRate = false, onPress, onLongPress, gradient, walletId, walletName, tokenCode } = props
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const currencyInfo = useSelector(state => state.core.account.currencyWallets[walletId].currencyInfo)
  const fiatCurrencyCode = useSelector(state => state.core.account.currencyWallets[walletId].fiatCurrencyCode)
  const balance = useSelector(state => state.core.account.currencyWallets[walletId].balances[currencyCode] ?? '0')
  const name = useSelector(state => state.core.account.currencyWallets[walletId].name)
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)

  // Crypto Amount And Exchange Rate
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyInfo.pluginId, currencyCode))
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const cryptoExchangeMultiplier = exchangeDenomination.multiplier

  const { fiatText: fiatBalanceText } = useFiatText({
    nativeCryptoAmount: balance,
    cryptoCurrencyCode: currencyCode,
    isoFiatCurrencyCode,
    cryptoExchangeMultiplier
  })

  const handlePress = useMemo(
    () => (onPress != null ? () => onPress(walletId, tokenCode ?? currencyCode) : () => {}),
    [currencyCode, onPress, tokenCode, walletId]
  )

  // Balance represented as crypto and fiat on right side of this row
  const children = useMemo(
    () => (
      <View style={styles.balance}>
        <EdgeText>
          <CryptoText walletId={walletId} tokenId={currencyCode} nativeAmount={balance} />
        </EdgeText>
        <EdgeText style={styles.fiatBalance}>{fiatBalanceText}</EdgeText>
      </View>
    ),
    [styles.balance, styles.fiatBalance, walletId, currencyCode, balance, fiatBalanceText]
  )

  return (
    <WalletListRow
      currencyCode={currencyCode}
      walletId={walletId}
      showRate={showRate}
      onPress={handlePress}
      onLongPress={onLongPress}
      walletName={walletName ?? name ?? `My ${currencyInfo?.displayName ?? ''}`}
      gradient={gradient}
    >
      {showBalance ? children : null}
    </WalletListRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  balance: {
    flexDirection: 'column',
    alignItems: 'flex-end'
  },
  fiatBalance: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))

export const WalletListCurrencyRow = memo(WalletListCurrencyRowComponent)
