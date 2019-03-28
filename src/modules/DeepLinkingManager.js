// @flow

import React from 'react'
import { Alert } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'
import parse from 'url-parse'

import { selectWallet } from '../actions/WalletActions.js'
import { PLUGIN_SPEND, SCAN } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import { buySellPlugins, spendPlugins } from '../modules/UI/scenes/Plugins/plugins'
import type { Dispatch } from './ReduxTypes.js'

type DeepLinkingManagerStateProps = {
  totalWalletCount: number,
  wallets: Object,
  addressDeepLinkData: Object,
  deepLinkPending: boolean
}

type DeepLinkingManagerDispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => any,
  markAddressDeepLinkDone: () => any
}

type Props = DeepLinkingManagerStateProps & DeepLinkingManagerDispatchProps

class DeepLinkingManager extends React.Component<Props> {
  render () {
    return null
  }

  componentDidUpdate () {
    if (Object.keys(this.props.wallets).length > 0 && this.props.deepLinkPending) this.checkForWallet()
  }
  processPluginDeepLink = (parsedUrl: Object) => {
    if (parsedUrl.pathname.includes('simplex')) {
      const plugins = spendPlugins(false).concat(buySellPlugins(false))
      let i = 0
      for (i; i < plugins.length; i++) {
        const plugin = plugins[i]
        if (plugin.name === 'Simplex') {
          Actions[PLUGIN_SPEND]({ plugin: plugin })
          this.props.markAddressDeepLinkDone()
          return
        }
      }
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
      default:
        return ''
    }
  }
}

const mapStateToProps = (state): DeepLinkingManagerStateProps => {
  return {
    totalWalletCount: state.ui.wallets.activeWalletIds.length,
    wallets: state.ui.wallets.byId,
    addressDeepLinkData: state.core.deepLinking.addressDeepLinkData,
    deepLinkPending: state.core.deepLinking.deepLinkPending
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DeepLinkingManagerDispatchProps => {
  return {
    selectWallet: (walletId: string, currencyCode: string) => dispatch(selectWallet(walletId, currencyCode)),
    markAddressDeepLinkDone: () =>
      dispatch({
        type: 'ADDRESS_DEEP_LINK_COMPLETE'
      })
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeepLinkingManager)
