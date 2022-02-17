// @flow

import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { selectWalletFromModal } from '../../actions/WalletActions.js'
import { CREATE_WALLET_SELECT_CRYPTO, MANAGE_TOKENS } from '../../constants/SceneKeys.js'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { type WalletListResult, WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type StateProps = {
  wallets: { [walletId: string]: GuiWallet }
}

type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

const TokenSupportedCurrencyCodes = Object.keys(SPECIAL_CURRENCY_INFO)
  .filter(pluginId => {
    const { isCustomTokensSupported = false, isAccountActivationRequired = false, keysOnlyMode = false } = SPECIAL_CURRENCY_INFO[pluginId]
    return isCustomTokensSupported && !isAccountActivationRequired && !keysOnlyMode
  })
  .map(pluginId => SPECIAL_CURRENCY_INFO[pluginId].chainCode)

class WalletListFooterComponent extends React.PureComponent<StateProps & ThemeProps & DispatchProps> {
  renderAddButton = (title: string, onPress: () => void) => {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.addButtonsContainer}>
        <TouchableOpacity onPress={onPress}>
          <View style={styles.addButtonsInnerContainer}>
            <Ionicon name="md-add" style={styles.addItem} size={theme.rem(1.5)} color={theme.iconTappable} />
            <EdgeText style={[styles.addItem, styles.addItemText]}>{title}</EdgeText>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  render() {
    const { theme } = this.props
    const styles = getStyles(theme)
    return (
      <View style={styles.container}>
        {this.renderAddButton(s.strings.wallet_list_add_wallet, () => Actions.push(CREATE_WALLET_SELECT_CRYPTO))}
        {this.renderAddButton(s.strings.wallet_list_add_token, this.addToken)}
      </View>
    )
  }

  addToken = () => {
    const { onSelectWallet } = this.props
    Airship.show(bridge => (
      <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={TokenSupportedCurrencyCodes} showCreateWallet />
    ))
      .then(({ walletId, currencyCode }: WalletListResult) => {
        if (walletId != null && currencyCode != null) {
          onSelectWallet(walletId, currencyCode)
          Actions.push(MANAGE_TOKENS, { walletId })
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
    flexDirection: 'row',
    alignItems: 'stretch',
    marginVertical: theme.rem(1),
    paddingTop: theme.rem(0.75),
    marginLeft: theme.rem(1),
    paddingRight: theme.rem(1),
    borderTopWidth: theme.thinLineWidth,
    borderTopColor: theme.lineDivider
  },
  addButtonsContainer: {
    flex: 1
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
    color: theme.textLink,
    fontFamily: theme.fontFaceMedium
  },
  addItemText: {
    flexShrink: 1
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
    fontFamily: theme.fontFaceMedium,
    color: theme.textLink
  }
}))

export const WalletListFooter = connect<StateProps, DispatchProps, {}>(
  state => ({
    wallets: state.ui.wallets.byId
  }),
  dispatch => ({
    onSelectWallet(walletId: string, currencyCode: string) {
      dispatch(selectWalletFromModal(walletId, currencyCode))
    }
  })
)(withTheme(WalletListFooterComponent))
