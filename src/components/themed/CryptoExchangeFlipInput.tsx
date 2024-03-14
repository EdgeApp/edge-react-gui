import { add } from 'biggystring'
import { EdgeCurrencyWallet, EdgeDenomination } from 'edge-core-js'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'

import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { getTokenIdForced } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDenomination } from '../../util/utils'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'
import { RowUi4 } from '../ui4/RowUi4'
import { EdgeText } from './EdgeText'
import { ExchangedFlipInput2, ExchangedFlipInputAmounts } from './ExchangedFlipInput2'
import { MainButton } from './MainButton'

interface Props {
  wallet?: EdgeCurrencyWallet
  buttonText: string
  headerText: string
  currencyCode: string
  displayDenomination: EdgeDenomination
  overridePrimaryNativeAmount: string
  isFocused: boolean
  isThinking?: boolean
  onFocuseWallet: () => void
  onSelectWallet: () => void
  onAmountChanged: (amounts: ExchangedFlipInputAmounts) => void
  onNext: () => void
  onFocus?: () => void
  onBlur?: () => void
  children?: React.ReactNode
}

export const CryptoExchangeFlipInput = (props: Props) => {
  const { children, currencyCode, displayDenomination, onNext, overridePrimaryNativeAmount, wallet } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  //
  // State
  //

  const [errorMessage, setErrorMessage] = useState('')

  //
  // Derived State
  //

  const account = useSelector(state => state.core.account)

  const tokenId = useMemo(() => {
    if (wallet == null) return null
    // This will error if wallet is undefined
    return getTokenIdForced(account, wallet.currencyInfo.pluginId, currencyCode)
  }, [account, currencyCode, wallet])

  const cryptoAmount = useMemo(() => {
    if (wallet == null || tokenId === undefined) return
    const balance = wallet.balanceMap.get(tokenId) ?? '0'
    const cryptoAmountRaw: string = convertNativeToDenomination(displayDenomination.multiplier)(balance)
    return formatNumber(add(cryptoAmountRaw, '0'))
  }, [displayDenomination.multiplier, tokenId, wallet])

  const guiWalletName = wallet == null ? undefined : getWalletName(wallet)

  //
  // Handlers
  //

  const handleAmountsChanged = (amounts: ExchangedFlipInputAmounts) => {
    props.onAmountChanged(amounts)
  }

  const launchSelector = () => {
    setErrorMessage('')
    props.onSelectWallet()
  }

  const focusMe = () => {
    setErrorMessage('')
    props.onFocuseWallet()
  }

  //
  // Render
  //

  const renderBalance = () => {
    if (cryptoAmount == null) {
      return null
    }

    return <EdgeText style={styles.balanceText}>{lstrings.string_wallet_balance + ': ' + cryptoAmount + ' ' + displayDenomination.name}</EdgeText>
  }

  if (props.isThinking) {
    return (
      <View style={[styles.container, styles.containerNoFee, styles.containerNoWalletSelected]}>
        <View style={styles.topRow}>
          <ActivityIndicator color={theme.iconTappable} />
        </View>
      </View>
    )
  }

  if (wallet == null) {
    return <MainButton label={props.buttonText} type="secondary" onPress={launchSelector} />
  }

  if (!props.isFocused) {
    return (
      <CardUi4>
        <RowUi4 icon={<CryptoIconUi4 sizeRem={1.75} walletId={wallet.id} tokenId={tokenId} />} onPress={focusMe}>
          <EdgeText style={styles.text}>{guiWalletName + ': ' + currencyCode}</EdgeText>
        </RowUi4>
      </CardUi4>
    )
  }

  return (
    <>
      <EdgeText style={styles.errorText}>{errorMessage}</EdgeText>
      {renderBalance()}
      <CardUi4>
        <ExchangedFlipInput2
          onNext={onNext}
          onFocus={props.onFocus}
          onBlur={props.onBlur}
          headerText={props.headerText}
          headerCallback={launchSelector}
          onAmountChanged={handleAmountsChanged}
          startNativeAmount={overridePrimaryNativeAmount}
          keyboardVisible={false}
          forceField="fiat"
          tokenId={tokenId}
          wallet={wallet}
        />
        {children}
      </CardUi4>
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    width: '100%'
  },
  containerNoFee: {
    backgroundColor: theme.tileBackground,
    borderRadius: 3
  },
  containerNoWalletSelected: {
    paddingVertical: theme.rem(0.75),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    marginLeft: theme.rem(0.5)
  },
  topRow: {
    height: theme.rem(2),
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  iconContainer: {
    top: theme.rem(0.125),
    borderRadius: theme.rem(1)
  },
  balanceText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(1),
    color: theme.secondaryText
  },
  errorText: {
    alignSelf: 'flex-start',
    marginLeft: theme.rem(0.5),
    marginBottom: theme.rem(0.75),
    color: theme.dangerText
  }
}))
