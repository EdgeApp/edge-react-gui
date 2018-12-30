// @flow

import React from 'react'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { selectWallet } from '../actions/WalletActions.js'
import { SCAN } from '../constants/indexConstants.js'
import type { Dispatch } from './ReduxTypes.js'

type DeepLinkingManagerStateProps = {
  wallets: Object,
  addressDeepLinkData: Object,
  deepLinkPending: boolean
}

type DeepLinkingManagerDispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => any
}

type Props = DeepLinkingManagerStateProps & DeepLinkingManagerDispatchProps

class DeepLinkingManager extends React.Component<Props> {
  render () {
    return null
  }

  componentDidUpdate () {
    if (Object.keys(this.props.wallets).length > 0 && this.props.deepLinkPending) this.checkForWallet()
  }

  checkForWallet () {
    const { addressDeepLinkData } = this.props
    const { currencyCode } = addressDeepLinkData

    if (!currencyCode) {
      Actions[SCAN]()
      return
    }

    for (const wallet in this.props.wallets) {
      if (this.props.wallets[wallet].currencyCode === currencyCode) {
        this.props.selectWallet(this.props.wallets[wallet].id, currencyCode)

        Actions[SCAN]()

        break
      }
    }
  }
}

const mapStateToProps = (state): DeepLinkingManagerStateProps => {
  return {
    wallets: state.ui.wallets.byId,
    addressDeepLinkData: state.core.deepLinking.addressDeepLinkData,
    deepLinkPending: state.core.deepLinking.deepLinkPending
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DeepLinkingManagerDispatchProps => {
  return {
    selectWallet: (walletId: string, currencyCode: string) => dispatch(selectWallet(walletId, currencyCode))
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeepLinkingManager)
