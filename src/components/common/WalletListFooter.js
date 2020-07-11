// @flow

import { createYesNoModal } from 'edge-components'
import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Alert, Image, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import credLogo from '../../assets/images/cred_logo.png'
import * as Constants from '../../constants/indexConstants.js'
import { guiPlugins } from '../../constants/plugins/GuiPlugins.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { makeCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { scale } from '../../util/scaling.js'
import { launchModal } from '../common/ModalProvider.js'

type StateProps = {
  account: EdgeAccount,
  wallets: { [walletId: string]: GuiWallet }
}
type DispatchProps = {}
type Props = StateProps & DispatchProps

class WalletListFooterComponent extends React.Component<Props> {
  render() {
    return (
      <View style={styles.multipleCallToActionWrap}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
          <TouchableWithoutFeedback onPress={Actions[Constants.CREATE_WALLET_SELECT_CRYPTO]} style={styles.addWalletButton}>
            <View style={styles.addWalletContentWrap}>
              <Ionicon name="md-add-circle" style={styles.addWalletIcon} size={scale(24)} color={THEME.COLORS.GRAY_2} />
              <T style={styles.addWalletText}>{s.strings.wallet_list_add_wallet}</T>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={this.addToken} style={styles.addWalletButton}>
            <View style={styles.addTokenContentWrap}>
              <Ionicon name="md-add-circle" style={styles.addWalletIcon} size={scale(24)} color={THEME.COLORS.GRAY_2} />
              <T style={styles.addWalletText}>{s.strings.wallet_list_add_token}</T>
            </View>
          </TouchableWithoutFeedback>
        </View>
        <TouchableWithoutFeedback onPress={Actions[Constants.PLUGIN_BUY]} style={styles.buyMultipleCryptoContainer}>
          <View style={styles.buyMultipleCryptoBox}>
            <View style={styles.buyMultipleCryptoContentWrap}>
              <Image style={styles.buyMultipleCryptoBoxImage} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES.BTC }} resizeMode="cover" />
              <Image style={styles.buyMultipleCryptoBoxImage} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES.ETH }} resizeMode="cover" />
              <Image style={styles.buyMultipleCryptoBoxImage} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES.BCH }} resizeMode="cover" />
            </View>
            <T style={styles.buyMultipleCryptoBoxText}>{s.strings.title_plugin_buy}</T>
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback
          onPress={() => Actions[Constants.PLUGIN_EARN_INTEREST]({ plugin: guiPlugins.cred })}
          style={styles.buyMultipleCryptoContainer}
        >
          <View style={styles.buyMultipleCryptoBox}>
            <View style={styles.buyMultipleCryptoContentWrap}>
              <Image style={styles.buyMultipleCryptoBoxImage} source={credLogo} resizeMode="contain" />
            </View>
            <T style={styles.buyMultipleCryptoBoxText}>{s.strings.earn_interest}</T>
          </View>
        </TouchableWithoutFeedback>
      </View>
    )
  }

  addToken = async () => {
    const { account, wallets } = this.props

    // check for existence of any token-enabled wallets
    for (const key in wallets) {
      const wallet = wallets[key]
      const specialCurrencyInfo = getSpecialCurrencyInfo(wallet.currencyCode)
      if (specialCurrencyInfo.isCustomTokensSupported) {
        return Actions.manageTokens({ guiWallet: wallet })
      }
    }

    // if no token-enabled wallets then allow creation of token-enabled wallet
    const { ethereum } = account.currencyConfig
    if (ethereum == null) {
      return Alert.alert(s.strings.create_wallet_invalid_input, s.strings.create_wallet_select_valid_crypto)
    }

    const answer = await launchModal(
      createYesNoModal({
        title: s.strings.wallet_list_add_token_modal_title,
        message: s.strings.wallet_list_add_token_modal_message,
        icon: <Icon type={Constants.ION_ICONS} name={Constants.WALLET_ICON} size={30} />,
        noButtonText: s.strings.string_cancel_cap,
        yesButtonText: s.strings.title_create_wallet
      })
    )

    if (answer) {
      Actions[Constants.CREATE_WALLET_SELECT_FIAT]({
        selectedWalletType: makeCreateWalletType(ethereum.currencyInfo)
      })
    }
  }
}

const rawStyles = {
  addWalletButton: {
    marginBottom: scale(15)
  },
  addWalletContentWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(15),
    marginRight: scale(5)
  },
  addTokenContentWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(15),
    marginLeft: scale(5)
  },
  addWalletIcon: {
    justifyContent: 'center',
    marginRight: scale(12),
    position: 'relative',
    top: scale(1)
  },
  addWalletText: {
    fontSize: scale(18),
    position: 'relative',
    top: scale(2),
    flexDirection: 'column',
    justifyContent: 'center',
    color: THEME.COLORS.GRAY_1
  },

  multipleCallToActionWrap: {
    padding: scale(15)
  },
  buyMultipleCryptoContainer: {
    height: scale(180),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: scale(15)
  },
  buyMultipleCryptoBox: {
    flex: 3,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    padding: scale(15),
    marginTop: scale(15)
  },
  buyMultipleCryptoContentWrap: {
    flexDirection: 'row'
  },
  buyMultipleCryptoBoxImage: {
    width: scale(32),
    height: scale(32),
    marginHorizontal: scale(4)
  },
  buyMultipleCryptoBoxText: {
    marginTop: scale(10),
    fontSize: scale(17),
    color: THEME.COLORS.GRAY_1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const WalletListFooter = connect(
  (state: ReduxState): StateProps => ({
    account: state.core.account,
    wallets: state.ui.wallets.byId
  }),
  (dispatch: Dispatch): DispatchProps => ({})
)(WalletListFooterComponent)
