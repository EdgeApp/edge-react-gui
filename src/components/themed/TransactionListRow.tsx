import { abs, div, eq, gt, log10 } from 'biggystring'
import { EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Share from 'react-native-share'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { formatCategory, splitCategory } from '../../actions/CategoriesActions'
import { TX_ACTION_LABEL_MAP } from '../../constants/txActionConstants'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants'
import { useContactThumbnail } from '../../hooks/redux/useContactThumbnail'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useHistoricalRate } from '../../hooks/useHistoricalRate'
import { useWatch } from '../../hooks/useWatch'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import {
  DECIMAL_PRECISION,
  decimalOrZero,
  DEFAULT_TRUNCATE_PRECISION,
  getDenomFromIsoCode,
  maxPrimaryCurrencyConversionDecimals,
  precisionAdjust,
  truncateDecimals,
  unixToLocaleDateTime
} from '../../util/utils'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CardUi4 } from '../ui4/CardUi4'
import { RowUi4 } from '../ui4/RowUi4'
import { EdgeText } from './EdgeText'

interface Props {
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet
  tokenId?: string
  currencyCode: string
  transaction: EdgeTransaction
}

export function TransactionListRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { navigation, currencyCode, wallet, tokenId, transaction } = props
  const { canReplaceByFee = false } = wallet.currencyInfo
  const { metadata, action } = transaction
  const { name, amountFiat: defaultAmountFiat = 0 } = metadata ?? {}

  const isSentTransaction = transaction.nativeAmount.startsWith('-') || (eq(transaction.nativeAmount, '0') && transaction.isSend)

  const fiatCurrencyCode = useWatch(wallet, 'fiatCurrencyCode')
  const nonIsoFiatCurrencyCode = fiatCurrencyCode.replace('iso:', '')
  const currencyInfo = wallet.currencyInfo

  const displayDenomination = useSelector(state => getDisplayDenomination(state, currencyInfo.pluginId, currencyCode))
  const exchangeDenomination = useSelector(state => getExchangeDenomination(state, currencyInfo.pluginId, currencyCode))
  const fiatDenomination = getDenomFromIsoCode(nonIsoFiatCurrencyCode)
  const denominationSymbol = displayDenomination.symbol

  const currencyName =
    currencyCode === currencyInfo.currencyCode
      ? currencyInfo.displayName
      : currencyInfo.metaTokens.find(metaToken => metaToken.currencyCode === currencyCode)?.currencyName
  const selectedCurrencyName = currencyName || currencyCode

  // Required Confirmations
  const requiredConfirmations = currencyInfo.requiredConfirmations || 1 // set default requiredConfirmations to 1, so once the transaction is in a block consider fully confirmed

  // CryptoAmount
  const rateKey = `${currencyCode}_${fiatCurrencyCode}`
  const exchangeRate: string = useSelector(state => state.exchangeRates[rateKey])
  let maxConversionDecimals = DEFAULT_TRUNCATE_PRECISION
  if (exchangeRate != null && gt(exchangeRate, '0')) {
    const precisionAdjustValue = precisionAdjust({
      primaryExchangeMultiplier: exchangeDenomination.multiplier,
      secondaryExchangeMultiplier: fiatDenomination.multiplier,
      exchangeSecondaryToPrimaryRatio: exchangeRate
    })
    maxConversionDecimals = maxPrimaryCurrencyConversionDecimals(log10(displayDenomination.multiplier), precisionAdjustValue)
  }
  const cryptoAmount = div(abs(transaction.nativeAmount ?? '0'), displayDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoExchangeAmount = div(abs(transaction.nativeAmount ?? '0'), exchangeDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoAmountFormat = formatNumber(decimalOrZero(truncateDecimals(cryptoAmount, maxConversionDecimals), maxConversionDecimals))

  const cryptoAmountString = `${isSentTransaction ? '-' : '+'}${denominationSymbol ? denominationSymbol + ' ' : ''}${cryptoAmountFormat}`

  // Fiat Amount
  const isoDate = new Date(transaction.date * 1000).toISOString()
  const historicalRate = useHistoricalRate(`${currencyCode}_${fiatCurrencyCode}`, isoDate)
  const amountFiat = defaultAmountFiat > 0 ? defaultAmountFiat : historicalRate * Number(cryptoExchangeAmount)
  const fiatAmount = displayFiatAmount(amountFiat)
  const fiatSymbol = getSymbolFromCurrency(nonIsoFiatCurrencyCode)

  const fiatAmountString = `${fiatSymbol}${fiatAmount}`

  // Transaction Title
  const transactionTitle =
    action != null
      ? TX_ACTION_LABEL_MAP[action.type]
      : transaction.metadata && transaction.metadata.name
      ? transaction.metadata.name
      : sprintf(isSentTransaction ? lstrings.transaction_sent_1s : lstrings.transaction_received_1s, selectedCurrencyName)

  // Icon & Thumbnail
  const thumbnailPath = useContactThumbnail(name)

  const isSwapIcon = (action != null && (action.type === 'swap' || action.type === 'swapOrderFill')) || transaction.swapData != null
  const arrowIconName = isSwapIcon ? 'swap-horizontal' : isSentTransaction ? 'arrow-up' : 'arrow-down'
  const arrowIconSize = thumbnailPath ? theme.rem(1) : theme.rem(1.25)
  const arrowIconColor = isSwapIcon ? theme.txDirFgSwapUi4 : isSentTransaction ? theme.txDirFgSendUi4 : theme.txDirFgReceiveUi4
  const arrowContainerStyle = [
    thumbnailPath ? styles.arrowIconOverlayContainer : styles.arrowIconContainer,
    isSwapIcon ? styles.arrowIconContainerSwap : isSentTransaction ? styles.arrowIconContainerSend : styles.arrowIconContainerReceive
  ]
  const arrowIcon = (
    <View style={arrowContainerStyle}>
      <Ionicons name={arrowIconName} size={arrowIconSize} color={arrowIconColor} style={styles.icon} />
    </View>
  )

  const icon = thumbnailPath ? (
    <View style={styles.contactContainer}>
      <FastImage style={styles.contactImage} source={{ uri: thumbnailPath }} />
      {arrowIcon}
    </View>
  ) : (
    arrowIcon
  )

  // Pending Text and Style
  const currentConfirmations = transaction.confirmations
  const isConfirmed = currentConfirmations === 'confirmed'

  const unconfirmedOrTimeText = isConfirmed
    ? unixToLocaleDateTime(transaction.date).time
    : !isSentTransaction && canReplaceByFee && currentConfirmations === 'unconfirmed'
    ? lstrings.fragment_transaction_list_unconfirmed_rbf
    : currentConfirmations === 'unconfirmed'
    ? lstrings.fragment_wallet_unconfirmed
    : currentConfirmations === 'dropped'
    ? lstrings.fragment_transaction_list_tx_dropped
    : typeof currentConfirmations === 'number'
    ? sprintf(lstrings.fragment_transaction_list_confirmation_progress, currentConfirmations, requiredConfirmations)
    : lstrings.fragment_transaction_list_tx_synchronizing

  const unconfirmedOrTimeStyle = isConfirmed ? styles.secondaryText : styles.unconfirmedText

  // Transaction Category
  const defaultCategory = !isSentTransaction ? 'income' : 'expense'
  let categoryText: string | undefined
  const category = transaction.metadata?.category
  if (category != null && category !== '') {
    categoryText = formatCategory(splitCategory(category, defaultCategory))
  }

  const handlePress = useHandler(() => {
    if (transaction == null) {
      return showError(lstrings.transaction_details_error_invalid)
    }
    navigation.push('transactionDetails', {
      edgeTransaction: transaction,
      walletId: wallet.id,
      tokenId
    })
  })

  const handleLongPress = useHandler(() => {
    const url = sprintf(currencyInfo.transactionExplorer, transaction.txid)
    const shareOptions = {
      url
    }
    Share.open(shareOptions).catch(e => showError(e))
  })

  return (
    <CardUi4 icon={icon} onPress={handlePress} onLongPress={handleLongPress} sections>
      <RowUi4>
        <View style={styles.row}>
          <EdgeText style={styles.titleText}>{transactionTitle}</EdgeText>
          <EdgeText style={styles.titleText}>{cryptoAmountString}</EdgeText>
        </View>
        <View style={styles.row}>
          <EdgeText style={unconfirmedOrTimeStyle}>{unconfirmedOrTimeText}</EdgeText>
          <EdgeText style={styles.fiatAmount}>{fiatAmountString}</EdgeText>
        </View>
      </RowUi4>

      {categoryText == null ? null : (
        <RowUi4>
          <EdgeText style={styles.secondaryText}>{categoryText}</EdgeText>
        </RowUi4>
      )}
    </CardUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  icon: {
    // Shadow styles for Android
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: -1, height: 2 },
    textShadowRadius: 1,
    // Shadow styles for iOS
    shadowColor: 'rgba(0, 0, 0, 0.7)',
    shadowOffset: { width: -1, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 1
  },
  contactContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1.25)
  },
  contactImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: theme.rem(1)
  },
  arrowIconOverlayContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(1.25),
    height: theme.rem(1.25),
    borderRadius: theme.rem(1.25 / 2),
    bottom: -theme.rem(0.35),
    right: -theme.rem(0.35)
  },
  arrowIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1.25)
  },
  // Pad the containers to account for vector icons having an off-center origin
  arrowIconContainerSend: {
    paddingTop: 1,
    backgroundColor: theme.txDirBgSendUi4
  },
  arrowIconContainerSwap: {
    backgroundColor: theme.txDirBgSwapUi4
  },
  arrowIconContainerReceive: {
    paddingBottom: 2,
    backgroundColor: theme.txDirBgReceiveUi4
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  titleText: {
    alignSelf: 'center',
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1,
    maxWidth: '60%'
  },
  fiatAmount: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    textAlign: 'right'
  },
  secondaryText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  unconfirmedText: {
    fontSize: theme.rem(0.75),
    color: theme.warningText
  }
}))
