// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'
import { connect } from 'react-redux'

import { refreshWallet } from '../../actions/WalletActions.js'
import { DEFAULT_STARTER_WALLET_NAMES } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { setEnabledTokens } from '../../modules/Core/Wallets/EnabledTokens.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CreateTokenType, CreateWalletType, GuiWallet } from '../../types/types.js'
import { getCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { showError, showFullScreenSpinner } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type OwnProps = {
  createWalletType?: CreateWalletType,
  createTokenType?: CreateTokenType,
  onPress: (walletId: string, currencyCode: string) => void
}

type StateProps = {
  account: EdgeAccount,
  defaultIsoFiat: string,
  wallets: { [string]: GuiWallet }
}

type DispatchProps = {
  tokenCreated(string, string[]): void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

class WalletListCreateRowComponent extends React.PureComponent<Props> {
  createWallet = (currencyCode: string, walletType: string) => {
    const { account, defaultIsoFiat } = this.props
    const [type, format] = walletType.split('-')

    return showFullScreenSpinner(
      s.strings.wallet_list_modal_creating_wallet,
      account.createCurrencyWallet(type, {
        name: DEFAULT_STARTER_WALLET_NAMES[currencyCode],
        defaultIsoFiat,
        keyOptions: format ? { format } : {}
      })
    )
  }

  createAndSelectWallet = async () => {
    const { createWalletType, onPress, wallets } = this.props
    try {
      if (createWalletType == null) throw new Error('Invalid Create Wallet Type')
      const { currencyCode, walletType } = createWalletType
      const wallet = await this.createWallet(currencyCode, walletType)
      const checkWalletsThenSelect = () => {
        if (wallets[wallet.id]) {
          onPress(wallet.id, wallet.currencyInfo.currencyCode)
        } else {
          setTimeout(checkWalletsThenSelect, 50)
        }
      }
      checkWalletsThenSelect() // To avoid race condition of selecting a wallet that is not yet on the redux state
    } catch (error) {
      showError(error)
    }
  }

  createAndSelectToken = async () => {
    const { account, createTokenType, onPress, tokenCreated, wallets } = this.props
    const { currencyWallets } = account

    try {
      if (createTokenType == null) throw new Error('Invalid Create Token Type')
      const { currencyCode, parentCurrencyCode } = createTokenType

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
        wallet = await this.createWallet(walletType.currencyCode, walletType.walletType)
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

  handlePress = () => (this.props.createWalletType ? this.createAndSelectWallet() : this.createAndSelectToken())

  render() {
    const { createWalletType, createTokenType, theme } = this.props
    const currencyCode = createWalletType?.currencyCode ?? createTokenType?.currencyCode ?? ''
    const currencyName = createWalletType?.currencyName ?? createTokenType?.currencyName ?? ''
    const symbolImage = createWalletType?.symbolImage ?? createTokenType?.symbolImage ?? ''
    const createText = createWalletType ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token
    const styles = getStyles(theme)
    return (
      <TouchableOpacity onPress={this.handlePress}>
        <View style={styles.container}>
          {!!symbolImage && (
            <View style={styles.iconContainer}>
              <Image style={styles.iconSize} source={{ uri: symbolImage }} />
            </View>
          )}
          <View style={styles.detailsContainer}>
            <EdgeText style={styles.detailsCurrencyCode}>{currencyCode}</EdgeText>
            <EdgeText style={styles.detailsName}>{currencyName}</EdgeText>
          </View>
          <EdgeText style={styles.createText}>{createText}</EdgeText>
        </View>
      </TouchableOpacity>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.rem(1)
  },

  // Icon
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  iconSize: {
    width: theme.rem(2),
    height: theme.rem(2)
  },

  // Details
  detailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  detailsCurrencyCode: {
    fontFamily: theme.fontFaceBold,
    marginRight: theme.rem(0.75)
  },
  detailsName: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },

  // Create Text
  createText: {
    fontFamily: theme.fontFaceBold
  }
}))

export const WalletListCreateRow = connect(
  (state: RootState): StateProps => {
    return {
      wallets: state.ui.wallets.byId,
      account: state.core.account,
      defaultIsoFiat: state.ui.settings.defaultIsoFiat
    }
  },
  (dispatch: Dispatch): DispatchProps => ({
    tokenCreated(walletId: string, tokens: string[]) {
      dispatch({
        type: 'UPDATE_WALLET_ENABLED_TOKENS',
        data: { walletId, tokens }
      })
      dispatch(refreshWallet(walletId))
    }
  })
)(withTheme(WalletListCreateRowComponent))
