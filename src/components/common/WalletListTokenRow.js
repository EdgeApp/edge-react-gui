// @flow

import * as React from 'react'
import { Image, StyleSheet, Text, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'

import { WALLET_LIST_OPTIONS_ICON } from '../../constants/WalletAndCurrencyConstants.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale, scaleH } from '../../util/scaling.js'
import { ProgressPie } from './ProgressPie.js'

type Props = {
  cryptoAmount: string,
  currencyCode: string,
  differencePercentage: string,
  differencePercentageStyle: 'neutral' | 'negative' | 'positive',
  exchangeRate: string,
  exchangeRateFiatSymbol: string,
  fiatBalance: string,
  fiatBalanceSymbol: string,
  handleSelectWallet: () => void,
  handleOpenWalletListMenuModal: () => void,
  isToken: boolean,
  symbolImage?: string,
  walletId: string,
  walletName: string,
  walletProgress: number
}

export class WalletListTokenRow extends React.PureComponent<Props> {
  render() {
    const {
      currencyCode,
      cryptoAmount,
      differencePercentage,
      differencePercentageStyle,
      exchangeRate,
      exchangeRateFiatSymbol,
      fiatBalance,
      fiatBalanceSymbol,
      handleSelectWallet,
      handleOpenWalletListMenuModal,
      isToken,
      walletName,
      symbolImage,
      walletProgress
    } = this.props
    const percentageStyle = {
      neutral: styles.walletDetailsRowDifferenceNeutral,
      positive: styles.walletDetailsRowDifferencePositive,
      negative: styles.walletDetailsRowDifferenceNegative
    }
    return (
      <TouchableHighlight
        style={[styles.container, isToken ? styles.containerBackgroundToken : styles.containerBackgroundCurrency]}
        underlayColor={THEME.COLORS.ROW_PRESSED}
        delayLongPress={500}
        onPress={handleSelectWallet}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowIconWrap}>
            {symbolImage && <Image style={styles.rowCurrencyLogoAndroid} source={{ uri: symbolImage }} resizeMode="cover" />}
            <View style={styles.rowCurrencyLogoAndroid}>
              <ProgressPie size={rowCurrencyOverlaySize} color={THEME.COLORS.OPAQUE_WHITE_2} progress={walletProgress} />
            </View>
          </View>
          <View style={styles.walletDetailsContainer}>
            <View style={styles.walletDetailsRow}>
              <T style={styles.walletDetailsRowCurrency}>{currencyCode}</T>
              <T style={styles.walletDetailsRowValue}>{cryptoAmount}</T>
            </View>
            <View style={styles.walletDetailsRow}>
              <T style={styles.walletDetailsRowName}>{walletName}</T>
              <View style={styles.walletDetailsFiatBalanceRow}>
                <T style={styles.walletDetailsRowFiat}>{fiatBalanceSymbol}</T>
                <T style={styles.walletDetailsRowFiat}>{fiatBalance}</T>
              </View>
            </View>
            <View style={styles.walletDetailsRowLine} />
            <View style={styles.walletDetailsRow}>
              <View style={styles.walletDetailsExchangeRow}>
                <T style={styles.walletDetailsRowExchangeRate}>{exchangeRateFiatSymbol}</T>
                <T style={styles.walletDetailsRowExchangeRate}>{exchangeRate}</T>
              </View>
              <T style={percentageStyle[differencePercentageStyle]}>{differencePercentage}</T>
            </View>
          </View>
          <TouchableWithoutFeedback onPress={handleOpenWalletListMenuModal}>
            <View style={styles.rowOptionsWrap}>
              <Text style={styles.rowOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableHighlight>
    )
  }
}

const rowCurrencyOverlaySize = scale(23.3)
const rawStyles = {
  container: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(106),
    backgroundColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
    borderColor: THEME.COLORS.GRAY_3
  },
  containerBackgroundCurrency: {
    backgroundColor: THEME.COLORS.WHITE
  },
  containerBackgroundToken: {
    backgroundColor: THEME.COLORS.GRAY_4
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  rowIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: scale(36)
  },
  rowCurrencyLogoAndroid: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    height: scale(23),
    width: scale(23),
    marginRight: scale(12),
    marginLeft: scale(3),
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  rowOptionsWrap: {
    width: scaleH(37),
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowOptionsIcon: {
    fontSize: scale(20),
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column',
    marginTop: scale(5)
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetailsRowLine: {
    height: 1,
    borderColor: 'rgba(14, 75, 117, 0.5)',
    borderBottomWidth: 1,
    marginTop: scale(12),
    marginBottom: scale(9)
  },
  walletDetailsRowCurrency: {
    flex: 1,
    fontSize: scale(18)
  },
  walletDetailsRowValue: {
    textAlign: 'right',
    fontSize: scale(18),
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowName: {
    flex: 1,
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowFiat: {
    fontSize: scale(14),
    textAlign: 'right',
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowExchangeRate: {
    fontSize: scale(14),
    textAlign: 'left',
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowDifferenceNeutral: {
    fontSize: scale(14),
    textAlign: 'right',
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowDifferencePositive: {
    fontSize: scale(14),
    textAlign: 'right',
    fontWeight: '400',
    color: THEME.COLORS.WALLET_LIST_DIFF_POSITIVE
  },
  walletDetailsRowDifferenceNegative: {
    fontSize: scale(14),
    textAlign: 'right',
    fontWeight: '400',
    color: THEME.COLORS.WALLET_LIST_DIFF_NEGATIVE
  },
  walletDetailsFiatBalanceRow: {
    flexDirection: 'row'
  },
  walletDetailsExchangeRow: {
    flexDirection: 'row',
    flex: 1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
