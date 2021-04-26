// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { connect } from 'react-redux'

import { refreshWallet } from '../../actions/WalletActions.js'
import { DEFAULT_STARTER_WALLET_NAMES } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { setEnabledTokens } from '../../modules/Core/Wallets/EnabledTokens.js'
import { type RootState } from '../../types/reduxTypes.js'
import type { CreateTokenType, CreateWalletType, GuiWallet } from '../../types/types.js'
import { getCreateWalletType } from '../../util/CurrencyInfoHelpers.js'
import { showError, showFullScreenSpinner } from '../services/AirshipInstance.js'
import { WalletListRow } from './WalletListRow.js'

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

type Props = OwnProps & StateProps & DispatchProps

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

  handlePress = () => {
    if (this.props.createWalletType) {
      this.createAndSelectWallet()
    } else {
      this.createAndSelectToken()
    }
  }

  render() {
    const { createWalletType, createTokenType } = this.props

    return (
      <WalletListRow
        currencyCode={createWalletType?.currencyCode ?? createTokenType?.currencyCode ?? ''}
        icon={createWalletType?.symbolImage ?? createTokenType?.symbolImage ?? ''}
        isModal
        label={createWalletType ? s.strings.fragment_create_wallet_create_wallet : s.strings.wallet_list_add_token}
        onPress={this.handlePress}
        walletName={createWalletType?.currencyName ?? createTokenType?.currencyName ?? ''}
      />
    )
  }
}

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
)(WalletListCreateRowComponent)
