// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Alert, Image, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { connect } from 'react-redux'

import * as Constants from '../../constants/indexConstants.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { makeCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { ButtonBox } from './ThemedButtons.js'

type StateProps = {
  account: EdgeAccount,
  wallets: { [walletId: string]: GuiWallet }
}

class WalletListFooterComponent extends React.PureComponent<StateProps & ThemeProps> {
  renderAddButton = (title: string, onPress: () => void) => {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.addButtonsContainer}>
        <TouchableHighlight activeOpacity={theme.underlayOpacity} underlayColor={theme.underlayColor} onPress={onPress}>
          <View style={styles.addButtonsInnerContainer}>
            <Ionicon name="md-add-circle" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
            <EdgeText style={styles.addItem}>{title}</EdgeText>
          </View>
        </TouchableHighlight>
      </View>
    )
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.container}>
        <View style={styles.addButtonsRowContainer}>
          {this.renderAddButton(s.strings.wallet_list_add_wallet, Actions[Constants.CREATE_WALLET_SELECT_CRYPTO])}
          {this.renderAddButton(s.strings.wallet_list_add_token, this.addToken)}
        </View>
        <ButtonBox margin={0.5} onPress={Actions[Constants.PLUGIN_BUY]}>
          <View style={styles.buyCryptoContainer}>
            <View style={styles.buyCryptoImagesContainer}>
              <Image style={styles.buyCryptoImages} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES.BTC }} resizeMode="cover" />
              <Image style={styles.buyCryptoImages} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES.ETH }} resizeMode="cover" />
              <Image style={styles.buyCryptoImages} source={{ uri: Constants.CURRENCY_SYMBOL_IMAGES.BCH }} resizeMode="cover" />
            </View>
            <EdgeText>{s.strings.title_plugin_buy_sell}</EdgeText>
          </View>
        </ButtonBox>
      </View>
    )
  }

  addToken = () => {
    const { account, wallets } = this.props

    // check for existence of any token-enabled wallets
    for (const key of Object.keys(wallets)) {
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

    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.wallet_list_add_token_modal_title}
        message={s.strings.wallet_list_add_token_modal_message}
        buttons={{
          confirm: { label: s.strings.title_create_wallet },
          cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
        }}
      />
    ))
      .then(answer => {
        if (answer === 'confirm') {
          Actions[Constants.CREATE_WALLET_SELECT_FIAT]({
            selectedWalletType: makeCreateWalletType(ethereum.currencyInfo)
          })
        }
      })
      .catch(error => {
        console.log(error)
      })
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    alignItems: 'stretch',
    margin: theme.rem(0.5)
  },
  addButtonsRowContainer: {
    flexDirection: 'row'
  },
  addButtonsContainer: {
    flex: 1,
    padding: theme.rem(0.5)
  },
  addButtonsInnerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.tileBackground,
    height: theme.rem(3.25)
  },
  addItem: {
    margin: theme.rem(0.25),
    fontFamily: theme.fontFaceBold
  },
  buyCryptoContainer: {
    backgroundColor: theme.tileBackground,
    height: theme.rem(5.5),
    justifyContent: 'center',
    alignItems: 'center'
  },
  buyCryptoImagesContainer: {
    flexDirection: 'row'
  },
  buyCryptoImages: {
    width: theme.rem(1.75),
    height: theme.rem(1.75),
    margin: theme.rem(0.25)
  },
  buyCryptoText: {
    fontFamily: theme.fontFaceBold
  }
}))

export const WalletListFooter = connect((state: RootState): StateProps => ({
  account: state.core.account,
  wallets: state.ui.wallets.byId
}))(withTheme(WalletListFooterComponent))
