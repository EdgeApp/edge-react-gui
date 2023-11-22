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
import { triggerHaptic } from '../../util/haptic'
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
import { ClickableRow } from './ClickableRow'
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

  // Thumbnail
  const thumbnailPath = useContactThumbnail(name)

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

  const cryptoAmountString = `${isSentTransaction ? '-' : '+'} ${denominationSymbol ? denominationSymbol + ' ' : ''}${cryptoAmountFormat}`

  // Fiat Amount
  const isoDate = new Date(transaction.date * 1000).toISOString()
  const historicalRate = useHistoricalRate(`${currencyCode}_${fiatCurrencyCode}`, isoDate)
  const amountFiat = defaultAmountFiat > 0 ? defaultAmountFiat : historicalRate * Number(cryptoExchangeAmount)
  const fiatAmount = displayFiatAmount(amountFiat)
  const fiatSymbol = getSymbolFromCurrency(nonIsoFiatCurrencyCode)

  const fiatAmountString = `${fiatSymbol} ${fiatAmount}`

  // Transaction Text and Icon
  let transactionText, transactionIcon, transactionStyle
  if (isSentTransaction) {
    transactionText =
      action != null
        ? TX_ACTION_LABEL_MAP[action.type]
        : transaction.metadata && transaction.metadata.name
        ? transaction.metadata.name
        : lstrings.fragment_transaction_list_sent_prefix + selectedCurrencyName
    transactionIcon = <Ionicons name="arrow-up" size={theme.rem(1.25)} color={theme.negativeText} style={styles.iconArrows} />
    transactionStyle = styles.iconSent
  } else {
    transactionText =
      action != null
        ? TX_ACTION_LABEL_MAP[action.type]
        : transaction.metadata && transaction.metadata.name
        ? transaction.metadata.name
        : lstrings.fragment_transaction_list_receive_prefix + selectedCurrencyName
    transactionIcon = <Ionicons name="arrow-down" size={theme.rem(1.25)} color={theme.positiveText} style={styles.iconArrows} />
    transactionStyle = styles.iconRequest
  }

  // Pending Text and Style
  const currentConfirmations = transaction.confirmations
  const pendingText =
    currentConfirmations === 'confirmed'
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

  const pendingStyle = currentConfirmations === 'confirmed' ? styles.completedTime : styles.partialTime

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
    triggerHaptic('impactLight')
    navigation.push('transactionDetails', {
      edgeTransaction: transaction,
      walletId: wallet.id,
      tokenId
    })
  })

  const handleLongPress = useHandler(() => {
    triggerHaptic('impactLight')
    const url = sprintf(currencyInfo.transactionExplorer, transaction.txid)
    const shareOptions = {
      url
    }
    Share.open(shareOptions).catch(e => showError(e))
  })

  return (
    <ClickableRow paddingRem={[0, 1]} onPress={handlePress} onLongPress={handleLongPress}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconArrowsContainer, transactionStyle, thumbnailPath ? null : styles.iconArrowsContainerBackground]}>
          {thumbnailPath ? null : transactionIcon}
        </View>
        <FastImage style={styles.icon} source={{ uri: thumbnailPath }} />
      </View>
      <View style={styles.transactionContainer}>
        <View style={styles.transactionRow}>
          <EdgeText style={styles.transactionText}>{transactionText}</EdgeText>
          <EdgeText style={isSentTransaction ? styles.negativeCryptoAmount : styles.positiveCryptoAmount}>{cryptoAmountString}</EdgeText>
        </View>
        <View style={styles.transactionRow}>
          <View style={styles.categoryAndTimeContainer}>
            {categoryText && <EdgeText style={styles.category}>{categoryText}</EdgeText>}
            <EdgeText style={pendingStyle}>{pendingText}</EdgeText>
          </View>
          <EdgeText style={styles.fiatAmount}>{fiatAmountString}</EdgeText>
        </View>
      </View>
    </ClickableRow>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  iconContainer: {
    marginRight: theme.rem(1)
  },
  iconArrowsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(2),
    height: theme.rem(2),
    borderWidth: theme.mediumLineWidth,
    borderRadius: theme.rem(0.75),
    zIndex: 1
  },
  iconArrowsContainerBackground: {
    backgroundColor: theme.transactionListIconBackground
  },
  iconSent: {
    borderColor: theme.negativeText,
    shadowColor: theme.negativeText,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.3,
    shadowRadius: theme.rem(0.5),
    elevation: 3
  },
  iconRequest: {
    borderColor: theme.positiveText,
    shadowColor: theme.positiveText,
    shadowOffset: {
      width: 0,
      height: 0
    },
    shadowOpacity: 0.3,
    shadowRadius: theme.rem(0.5),
    elevation: 3
  },
  icon: {
    position: 'absolute',
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(0.75)
  },
  // Some of the react-native-vector-icon icons does have surrounding white space and leans towards the left.
  // Tested some other icons also like the AntDesign and MaterialIcons and have similar problems.
  // Needed to be replaced by a custom icon to remove hack.
  iconArrows: {
    marginLeft: 1
  },
  transactionContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  transactionRow: {
    flexDirection: 'row'
  },
  transactionText: {
    flex: 1,
    fontFamily: theme.fontFaceMedium
  },
  positiveCryptoAmount: {
    marginLeft: theme.rem(0.5),
    fontFamily: theme.fontFaceMedium,
    color: theme.positiveText,
    textAlign: 'right'
  },
  negativeCryptoAmount: {
    marginLeft: theme.rem(0.5),
    fontFamily: theme.fontFaceMedium,
    color: theme.negativeText,
    textAlign: 'right'
  },
  fiatAmount: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    textAlign: 'right'
  },
  categoryAndTimeContainer: {
    flex: 1
  },
  category: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  partialTime: {
    fontSize: theme.rem(0.75),
    color: theme.warningText
  },
  pendingTime: {
    fontSize: theme.rem(0.75),
    color: theme.dangerText
  },
  completedTime: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  }
}))
