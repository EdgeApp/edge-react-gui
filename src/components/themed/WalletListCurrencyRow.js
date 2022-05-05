// @flow

import * as React from 'react'
import { View } from 'react-native'

import { getExchangeDenominationFromState } from '../../selectors/DenominationSelectors.js'
import { memo, useEffect, useMemo, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { getTokenId } from '../../util/CurrencyInfoHelpers.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { CryptoText } from '../common/text/CryptoText.js'
import { FiatText } from '../common/text/FiatText.js'
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

  // Subscribe to wallet updates
  const showBalance = useSelector(state => state.ui.settings.isAccountBalanceVisible)
  const account = useSelector(state => state.core.account)
  const wallet = useSelector(state => state.core.account.currencyWallets[walletId])

  const { currencyInfo } = wallet
  const [fiatCurrencyCode, setFiatCurrencyCode] = useState(wallet.fiatCurrencyCode)
  const [balances, setBalances] = useState(wallet.balances)
  const [name, setName] = useState(wallet.name)
  useEffect(() => {
    const watchers = []
    if (wallet != null) {
      watchers.push(wallet.watch('fiatCurrencyCode', setFiatCurrencyCode))
      watchers.push(wallet.watch('name', setName))
      watchers.push(wallet.watch('balances', setBalances))
    }
    return () => watchers.forEach(cleaner => cleaner())
  }, [wallet])

  // Crypto Amount And Exchange Rate
  const balance = balances[currencyCode] ?? '0'
  const exchangeDenomination = dispatch(getExchangeDenominationFromState(currencyInfo.pluginId, currencyCode))
  const isoFiatCurrencyCode = fixFiatCurrencyCode(fiatCurrencyCode)
  const cryptoExchangeMultiplier = exchangeDenomination.multiplier

  const handlePress = useMemo(
    () => (onPress != null ? () => onPress(walletId, tokenCode ?? currencyCode) : () => {}),
    [currencyCode, onPress, tokenCode, walletId]
  )

  // Balance represented as crypto and fiat on right side of this row
  const children = useMemo(
    () =>
      account != null && wallet != null ? (
        <View style={styles.balance}>
          <EdgeText>
            <CryptoText wallet={wallet} tokenId={getTokenId(account, wallet.currencyInfo.pluginId, currencyCode)} nativeAmount={balance} />
          </EdgeText>
          <EdgeText style={styles.fiatBalance}>
            <FiatText
              wallet={wallet}
              nativeCryptoAmount={balance}
              currencyCode={currencyCode}
              isoFiatCurrencyCode={isoFiatCurrencyCode}
              cryptoExchangeMultiplier={cryptoExchangeMultiplier}
            />
          </EdgeText>
        </View>
      ) : null,
    [styles.balance, styles.fiatBalance, wallet, account, currencyCode, balance, isoFiatCurrencyCode, cryptoExchangeMultiplier]
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
