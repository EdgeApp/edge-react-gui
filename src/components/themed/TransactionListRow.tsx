import { abs, div, eq, gt, log10 } from 'biggystring'
import { EdgeCurrencyInfo, EdgeCurrencyWallet, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ShadowedView } from 'react-native-fast-shadow'
import Share from 'react-native-share'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { formatCategory, getTxActionDisplayInfo, pluginIdIcons, splitCategory } from '../../actions/CategoriesActions'
import { getFiatSymbol } from '../../constants/WalletAndCurrencyConstants'
import { useContactThumbnail } from '../../hooks/redux/useContactThumbnail'
import { useDisplayDenom } from '../../hooks/useDisplayDenom'
import { displayFiatAmount } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import { useHistoricalRate } from '../../hooks/useHistoricalRate'
import { formatNumber } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { getExchangeDenom } from '../../selectors/DenominationSelectors'
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
import { EdgeCard } from '../cards/EdgeCard'
import { SectionView } from '../layout/SectionView'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  navigation: NavigationBase
  wallet: EdgeCurrencyWallet
  transaction: EdgeTransaction
}

export function TransactionListRow(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { navigation, wallet, transaction } = props
  const { metadata = {}, currencyCode, tokenId } = transaction
  const currencyInfo = wallet.currencyInfo

  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const account = useSelector(state => state.core.account)

  const displayDenomination = useDisplayDenom(wallet.currencyConfig, tokenId)
  const exchangeDenomination = getExchangeDenom(wallet.currencyConfig, tokenId)
  const fiatDenomination = getDenomFromIsoCode(defaultIsoFiat)
  const denominationSymbol = displayDenomination.symbol
  const defaultAmountFiat = metadata.exchangeAmount?.[defaultIsoFiat] ?? 0

  // CryptoAmount
  const rateKey = `${currencyCode}_${defaultIsoFiat}`
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

  const { direction, iconPluginId, mergedData } = getTxActionDisplayInfo(transaction, account, wallet)
  const { category, name } = mergedData
  const isSentTransaction = direction === 'send'

  const cryptoAmount = div(abs(transaction.nativeAmount ?? '0'), displayDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoExchangeAmount = div(abs(transaction.nativeAmount ?? '0'), exchangeDenomination.multiplier, DECIMAL_PRECISION)
  const cryptoAmountFormat = formatNumber(decimalOrZero(truncateDecimals(cryptoAmount, maxConversionDecimals), maxConversionDecimals))

  const cryptoAmountString = `${isSentTransaction ? '-' : '+'}${denominationSymbol ? denominationSymbol + ' ' : ''}${cryptoAmountFormat}`

  // Fiat Amount
  const isoDate = new Date(transaction.date * 1000).toISOString()
  const historicalRate = useHistoricalRate(`${currencyCode}_${defaultIsoFiat}`, isoDate)
  const amountFiat = (defaultAmountFiat ?? 0) > 0 ? defaultAmountFiat ?? 0 : historicalRate * Number(cryptoExchangeAmount)
  const fiatAmount = displayFiatAmount(amountFiat)
  const fiatSymbol = getFiatSymbol(defaultIsoFiat)

  const fiatAmountString = `${fiatSymbol}${fiatAmount}`

  // Transaction Text and Icon
  let arrowContainerStyle: StyleProp<ViewStyle> = []
  let arrowIconName, arrowIconColor, arrowIconSize

  // Assign defaults if transaction is just basic send/recv
  if (isSentTransaction) {
    arrowIconName = 'arrow-up'
    arrowIconColor = theme.txDirFgSend
    arrowContainerStyle = [styles.arrowIconContainerSend]
  } else {
    arrowIconName = 'arrow-down'
    arrowIconColor = theme.txDirFgReceive
    arrowContainerStyle = [styles.arrowIconContainerReceive]
  }

  const edgeCategory = splitCategory(category ?? '')

  if (edgeCategory.category === 'exchange') {
    arrowIconName = 'swap-horizontal'
    arrowIconColor = theme.txDirFgSwap
    arrowContainerStyle = [styles.arrowIconContainerSwap]
  }

  // Icon & Thumbnail
  const thumbnailPath = useContactThumbnail(name) ?? pluginIdIcons[iconPluginId ?? '']
  if (thumbnailPath != null) {
    arrowIconSize = theme.rem(1)
    arrowContainerStyle.push(styles.arrowIconOverlayContainer)
  } else {
    arrowIconSize = theme.rem(1.25)
    arrowContainerStyle.push(styles.arrowIconContainer)
  }

  const arrowIcon = (
    <ShadowedView style={arrowContainerStyle}>
      <Ionicons name={arrowIconName} size={arrowIconSize} color={arrowIconColor} style={styles.icon} />
    </ShadowedView>
  )

  const iconSource = React.useMemo(() => ({ uri: thumbnailPath }), [thumbnailPath])

  const icon =
    thumbnailPath != null ? (
      <ShadowedView style={styles.contactContainer}>
        <FastImage style={styles.contactImage} source={iconSource} />
        {arrowIcon}
      </ShadowedView>
    ) : (
      arrowIcon
    )

  // Pending Text and Style
  const unconfirmedOrTimeText = getConfirmationText(currencyInfo, transaction)

  const confirmationStyle =
    transaction.confirmations === 'confirmed' ? null : transaction.confirmations === 'failed' ? styles.failedText : styles.unconfirmedText

  // Transaction Category
  let categoryText
  // Only show a category text if the category is not a standard 'income:' or 'expense:'
  if (edgeCategory.subcategory !== '' || (edgeCategory.category.toLowerCase() !== 'income' && edgeCategory.category.toLowerCase() !== 'expense')) {
    categoryText = formatCategory(edgeCategory)
  }

  const handlePress = useHandler(() => {
    if (transaction == null) {
      return showError(lstrings.transaction_details_error_invalid)
    }
    navigation.push('transactionDetails', {
      edgeTransaction: transaction,
      walletId: wallet.id
    })
  })

  const handleLongPress = useHandler(() => {
    const url = sprintf(currencyInfo.transactionExplorer, transaction.txid)
    const shareOptions = {
      failOnCancel: false,
      url
    }
    Share.open(shareOptions).catch(e => showError(e))
  })

  // HACK: Handle 100% of the margins because of SceneHeader usage on this scene
  return (
    <EdgeCard icon={icon} onPress={handlePress} onLongPress={handleLongPress}>
      <SectionView dividerMarginRem={[0.2, 0.5]} marginRem={[0.25, 0]}>
        <>
          <View style={styles.row}>
            <EdgeText ellipsizeMode="tail" style={styles.titleText}>
              {name}
            </EdgeText>
            <EdgeText style={styles.cryptoText}>{cryptoAmountString}</EdgeText>
          </View>
          <View style={styles.row}>
            <EdgeText ellipsizeMode="tail" style={[styles.secondaryText, confirmationStyle]}>
              {unconfirmedOrTimeText}
            </EdgeText>
            <EdgeText style={styles.fiatAmount}>{fiatAmountString}</EdgeText>
          </View>
        </>
        {categoryText == null ? null : (
          <View style={styles.row}>
            <EdgeText style={styles.secondaryText}>{categoryText}</EdgeText>
          </View>
        )}
      </SectionView>
    </EdgeCard>
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
    borderRadius: theme.rem(1.25),
    ...theme.iconShadow
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
    borderRadius: theme.rem(1.25),
    ...theme.iconShadow
  },
  // Pad the containers to account for vector icons having an off-center origin
  arrowIconContainerSend: {
    paddingTop: 1,
    backgroundColor: theme.txDirBgSend
  },
  arrowIconContainerSwap: {
    backgroundColor: theme.txDirBgSwap
  },
  arrowIconContainerReceive: {
    paddingBottom: 2,
    backgroundColor: theme.txDirBgReceive
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.rem(0.5)
  },
  titleText: {
    alignSelf: 'center',
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1,
    marginRight: theme.rem(1)
  },
  cryptoText: {
    alignSelf: 'center',
    textAlign: 'right',
    flexShrink: 0
  },
  fiatAmount: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    textAlign: 'right'
  },
  secondaryText: {
    flexShrink: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText,
    marginRight: theme.rem(1)
  },
  unconfirmedText: {
    color: theme.warningText
  },
  failedText: {
    color: theme.dangerText
  }
}))

function getConfirmationText(currencyInfo: EdgeCurrencyInfo, transaction: EdgeTransaction): string {
  // Default requiredConfirmations to 1, so once the transaction is in a block consider fully confirmed
  // Default canReplaceByFee to false, so we don't show the RBF message unless the currencyInfo has it set.
  const { canReplaceByFee = false, requiredConfirmations = 1 } = currencyInfo

  const isSentTransaction = transaction.nativeAmount.startsWith('-') || (eq(transaction.nativeAmount, '0') && transaction.isSend)

  if (transaction.confirmations === 'confirmed') {
    return unixToLocaleDateTime(transaction.date).time
  }
  if (!isSentTransaction && canReplaceByFee && transaction.confirmations === 'unconfirmed') {
    return lstrings.fragment_transaction_list_unconfirmed_rbf
  }
  if (transaction.confirmations === 'unconfirmed') {
    return lstrings.fragment_wallet_unconfirmed
  }
  if (transaction.confirmations === 'dropped') {
    return lstrings.fragment_transaction_list_tx_dropped
  }
  if (transaction.confirmations === 'failed') {
    return lstrings.fragment_transaction_list_tx_failed
  }
  if (typeof transaction.confirmations === 'number') {
    return sprintf(lstrings.fragment_transaction_list_confirmation_progress, transaction.confirmations, requiredConfirmations)
  }

  return lstrings.fragment_transaction_list_tx_synchronizing
}
