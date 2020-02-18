// @flow

import React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'
import parse from 'url-parse'

import { selectWallet } from '../../actions/WalletActions.js'
import { pluginUrlMap } from '../../constants/plugins/buySellPlugins.js'
import { PLUGIN_VIEW_DEEP, SCAN } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'

type StateProps = {
  addressDeepLinkData: Object,
  deepLinkPending: boolean,
  totalWalletCount: number,
  wallets: Object
}

type DispatchProps = {
  markAddressDeepLinkDone(): void,
  selectWallet(walletId: string, currencyCode: string): void
}

type Props = StateProps & DispatchProps

class DeepLinkingManagerComponent extends React.Component<Props> {
  render () {
    return null
  }

  componentDidUpdate () {
    if (Object.keys(this.props.wallets).length > 0 && this.props.deepLinkPending) this.checkForWallet()
  }
  processPluginDeepLink = (parsedUrl: Object) => {
    if (parsedUrl.pathname.includes('simplex')) {
      const plugin = pluginUrlMap['co.edgesecure.simplex']
      Actions[PLUGIN_VIEW_DEEP]({ plugin })
      this.props.markAddressDeepLinkDone()
      return
    }
    this.props.markAddressDeepLinkDone()
  }

  checkForWallet () {
    const { addressDeepLinkData } = this.props
    const { currencyCode } = addressDeepLinkData
    // check to see what we have for a deep link.
    const parsedUrl = parse(addressDeepLinkData.uri, {}, false)
    if (parsedUrl.hostname === 'plugins') {
      this.processPluginDeepLink(parsedUrl)
      return
    }
    if (!currencyCode) {
      Actions[SCAN]()
      return
    }

    for (const wallet in this.props.wallets) {
      if (this.props.wallets[wallet].currencyCode === currencyCode) {
        this.props.selectWallet(this.props.wallets[wallet].id, currencyCode)

        Actions[SCAN]()

        return
      }
    }

    if (Object.keys(this.props.wallets).length === this.props.totalWalletCount) {
      this.props.markAddressDeepLinkDone()

      const currency = this.convertCurrencyStringFromCurrencyCode(currencyCode)
      const noWalletMessage = sprintf(s.strings.alert_deep_link_no_wallet, currency, currency)
      Alert.alert(noWalletMessage)
    }
  }

  convertCurrencyStringFromCurrencyCode (code: string) {
    switch (code) {
      case 'BTC':
        return 'Bitcoin'
      case 'BCH':
        return 'Bitcoin Cash'
      case 'ETH':
        return 'Ethereum'
      case 'LTC':
        return 'Litecoin'
      case 'DASH':
        return 'Dash'
      case 'RBTC':
        return 'RSK'
      default:
        return ''
    }
  }
}

export const DeepLinkingManager = connect(
  (state: ReduxState): StateProps => ({
    addressDeepLinkData: state.core.deepLinking.addressDeepLinkData,
    deepLinkPending: state.core.deepLinking.deepLinkPending,
    totalWalletCount: state.ui.wallets.activeWalletIds.length,
    wallets: state.ui.wallets.byId
  }),

  (dispatch: Dispatch): DispatchProps => ({
    markAddressDeepLinkDone () {
      dispatch({ type: 'ADDRESS_DEEP_LINK_COMPLETE' })
    },
    selectWallet (walletId: string, currencyCode: string) {
      dispatch(selectWallet(walletId, currencyCode))
    }
  })
)(DeepLinkingManagerComponent)
