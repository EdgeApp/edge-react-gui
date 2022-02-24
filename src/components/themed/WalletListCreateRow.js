// @flow

import type { Disklet } from 'disklet'
import { type EdgeAccount, type EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { createCurrencyWallet } from '../../actions/CreateWalletActions'
import { approveTokenTerms } from '../../actions/TokenTermsActions.js'
import { refreshWallet, selectWallet } from '../../actions/WalletActions.js'
import { getPluginId, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { setEnabledTokens } from '../../modules/Core/Wallets/EnabledTokens.js'
import { connect } from '../../types/reactRedux.js'
import type { CreateTokenType, CreateWalletType, GuiWallet } from '../../types/types.js'
import { getCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { showFullScreenSpinner } from '../modals/AirshipFullScreenSpinner.js'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { WalletListRow } from './WalletListRow.js'

type OwnProps = {
  createWalletType?: CreateWalletType,
  createTokenType?: CreateTokenType,
  onPress: (walletId: string, currencyCode: string) => void
}

type StateProps = {
  account: EdgeAccount,
  defaultIsoFiat: string,
  disklet: Disklet,
  wallets: { [string]: GuiWallet }
}

type DispatchProps = {
  tokenCreated: (walletId: string, tokens: string[]) => void,
  createWallet: (walletName: string, walletType: string, fiatCurrencyCode: string) => Promise<EdgeCurrencyWallet>
}

type Props = OwnProps & StateProps & ThemeProps & DispatchProps

// For some reason Flow complains if DispatchProps isn't added here too
class WalletListCreateRowComponent extends React.PureComponent<Props & DispatchProps> {
  createAndSelectWallet = async () => {
    const { createWalletType, onPress, defaultIsoFiat } = this.props
    try {
      if (createWalletType == null) throw new Error('Invalid Create Wallet Type')
      const { walletType } = createWalletType
      const wallet = await showFullScreenSpinner(
        s.strings.wallet_list_modal_creating_wallet,
        this.props.createWallet(SPECIAL_CURRENCY_INFO[getPluginId(walletType)].initWalletName, walletType, defaultIsoFiat)
      )
      onPress(wallet.id, wallet.currencyInfo.currencyCode)
    } catch (error) {
      showError(error)
    }
  }

  createAndSelectToken = async () => {
    const { account, createTokenType, defaultIsoFiat, disklet, onPress, tokenCreated, wallets } = this.props
    const { currencyWallets } = account

    try {
      if (createTokenType == null) throw new Error('Invalid Create Token Type')
      const { currencyCode, parentCurrencyCode } = createTokenType
      // Show the user the token terms modal only once
      await approveTokenTerms(disklet, parentCurrencyCode)
      // Find existing EdgeCurrencyWallet
      let wallet
      for (const walletId of Object.keys(currencyWallets)) {
        const currencyWallet = currencyWallets[walletId]
        if (currencyWallet.currencyInfo.currencyCode === parentCurrencyCode) {
          wallet = currencyWallet
          break
        }
      }

      if (!wallet) {
        const walletType = getCreateWalletType(account, parentCurrencyCode)
        if (!walletType) throw new Error(s.strings.create_wallet_failed_message)
        wallet = await this.props.createWallet(walletType.currencyCode, walletType.walletType, defaultIsoFiat)
      }

      const guiWalletEnabledTokens = wallets[wallet.id]?.enabledTokens ?? []
      const enabledTokens = await showFullScreenSpinner(
        s.strings.wallet_list_modal_enabling_token,
        // Should use EdgeCurrencyWallet.getEnabledTokens() but function seems to return parent currency code as part of the array
        setEnabledTokens(wallet, [...guiWalletEnabledTokens, currencyCode], [])
      )

      tokenCreated(wallet.id, enabledTokens)
      onPress(wallet.id, currencyCode)
    } catch (error) {
      showError(error)
    }
  }

  handlePress = () => {
    if (this.props.createWalletType) {
      this.createAndSelectWallet().catch(showError)
    } else {
      this.createAndSelectToken().catch(showError)
    }
  }

  renderIcon() {
    const { createWalletType, createTokenType } = this.props
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.iconContainer}>
        <FastImage style={styles.iconSize} source={{ uri: createWalletType?.symbolImage ?? createTokenType?.symbolImage ?? '' }} />
      </View>
    )
  }

  renderChildren() {
    const { createWalletType } = this.props
    const styles = getStyles(this.props.theme)
    return (
      <View style={styles.labelContainer}>
        <EdgeText style={styles.labelText}>{createWalletType ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}</EdgeText>
      </View>
    )
  }

  render() {
    const { createWalletType, createTokenType } = this.props

    return (
      <WalletListRow
        currencyCode={createWalletType?.currencyCode ?? createTokenType?.currencyCode ?? ''}
        icon={this.renderIcon()}
        onPress={this.handlePress}
        walletName={createWalletType?.currencyName ?? createTokenType?.currencyName ?? ''}
      >
        {this.renderChildren()}
      </WalletListRow>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  // Icons
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },

  // Label
  labelContainer: {
    justifyContent: 'center'
  },
  labelText: {
    fontFamily: theme.fontFaceMedium
  }
}))

export const WalletListCreateRow = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    wallets: state.ui.wallets.byId,
    account: state.core.account,
    disklet: state.core.disklet,
    defaultIsoFiat: state.ui.settings.defaultIsoFiat
  }),
  dispatch => ({
    tokenCreated(walletId: string, tokens: string[]) {
      dispatch({
        type: 'UPDATE_WALLET_ENABLED_TOKENS',
        data: { walletId, tokens }
      })
      dispatch(refreshWallet(walletId))
    },
    async createWallet(walletName: string, walletType: string, fiatCurrencyCode: string) {
      const wallet = await dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode))
      dispatch(selectWallet(wallet.id, wallet.currencyInfo.currencyCode))
      return wallet
    }
  })
)(withTheme(WalletListCreateRowComponent))
