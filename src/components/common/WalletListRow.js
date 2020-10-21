// @flow

import * as React from 'react'
import { Image, StyleSheet, Text, TouchableHighlight, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { selectWallet } from '../../actions/WalletActions.js'
import { getSpecialCurrencyInfo, TRANSACTION_LIST, WALLET_LIST_SCENE } from '../../constants/indexConstants.js'
import { WALLET_LIST_OPTIONS_ICON } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type GuiWallet } from '../../types/types.js'
import { scale, scaleH } from '../../util/scaling.js'
import { WalletListMenuModal } from '../modals/WalletListMenuModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { ProgressPie } from './ProgressPie.js'

type OwnProps = {
  differencePercentage: string,
  differencePercentageStyle: any,
  exchangeRate: string,
  exchangeRateFiatSymbol: string,
  fiatBalance: string,
  fiatBalanceSymbol: string,
  cryptoAmount: string,
  guiWallet: GuiWallet,
  walletProgress: number
}

type DispatchProps = {
  selectWallet(walletId: string, currencyCode: string): void
}

type Props = OwnProps & DispatchProps

class WalletListRowComponent extends React.PureComponent<Props> {
  _onPressSelectWallet = (walletId, currencyCode, publicAddress) => {
    this.props.selectWallet(walletId, currencyCode)
    // if it's EOS then we need to see if activated, if not then it will get routed somewhere else
    // if it's not EOS then go to txList, if it's EOS and activated with publicAddress then go to txList
    const SPECIAL_CURRENCY_INFO = getSpecialCurrencyInfo(currencyCode)
    if (!SPECIAL_CURRENCY_INFO.isAccountActivationRequired || (SPECIAL_CURRENCY_INFO.isAccountActivationRequired && publicAddress)) {
      Actions[TRANSACTION_LIST]({ params: 'walletList' })
    }
  }

  openWalletListMenuModal = async () => {
    const { guiWallet } = this.props
    await Airship.show(bridge => (
      <WalletListMenuModal
        bridge={bridge}
        walletId={guiWallet.id}
        walletName={guiWallet.name}
        currencyCode={guiWallet.currencyCode}
        image={guiWallet.symbolImage}
      />
    ))
  }

  render() {
    const {
      differencePercentage,
      differencePercentageStyle,
      exchangeRate,
      exchangeRateFiatSymbol,
      fiatBalance,
      fiatBalanceSymbol,
      cryptoAmount,
      guiWallet,
      walletProgress
    } = this.props
    const { id, currencyCode, name, receiveAddress, symbolImageDarkMono } = guiWallet
    return (
      <View style={{ width: '100%' }}>
        <View>
          <TouchableHighlight
            style={styles.rowContainer}
            underlayColor={THEME.COLORS.ROW_PRESSED}
            onPress={() => this._onPressSelectWallet(id, currencyCode, receiveAddress.publicAddress)}
          >
            <View style={styles.rowContent}>
              <View style={styles.rowIconWrap}>
                {symbolImageDarkMono && <Image style={styles.rowCurrencyLogoAndroid} source={{ uri: symbolImageDarkMono }} resizeMode="cover" />}
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
                  <T style={styles.walletDetailsRowName}>{name || s.strings.string_no_name}</T>
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
                  <T style={differencePercentageStyle}>{differencePercentage}</T>
                </View>
              </View>
              <TouchableWithoutFeedback onPress={this.openWalletListMenuModal}>
                <View style={styles.rowOptionsWrap}>
                  <Text style={styles.rowOptionsIcon}>{WALLET_LIST_OPTIONS_ICON}</Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableHighlight>
        </View>
      </View>
    )
  }
}

const rowCurrencyOverlaySize = scale(23.3)
const rawStyles = {
  rowContainer: {
    padding: scale(6),
    paddingLeft: scale(8),
    height: scale(106),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
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
  symbol: {
    fontFamily: THEME.FONTS.SYMBOLS
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

export const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const WalletListRow = connect(null, (dispatch: Dispatch): DispatchProps => ({
  selectWallet(walletId: string, currencyCode) {
    dispatch(selectWallet(walletId, currencyCode, WALLET_LIST_SCENE))
  }
}))(WalletListRowComponent)
