// @flow

import type { EdgeAccount } from 'edge-core-js'
import React from 'react'
import { connect } from 'react-redux'

import { updateWalletsRequest } from '../../modules/Core/Wallets/action.js'
import { updateExchangeRates } from '../../modules/ExchangeRates/action.js'
import type { Dispatch, State } from '../../modules/ReduxTypes.js'

type EdgeAccountCallbackManagerStateProps = {
  account: EdgeAccount
}

type EdgeAccountCallbackManagerDispatchProps = {
  updateWalletsRequest: () => any,
  updateExchangeRates: () => any
}

type Props = EdgeAccountCallbackManagerStateProps & EdgeAccountCallbackManagerDispatchProps

class EdgeAccountCallbackManager extends React.Component<Props> {
  render () {
    return null
  }

  componentDidUpdate () {
    if (this.props.account.id) this.subscribeToAccount()
  }

  subscribeToAccount = () => {
    const { account } = this.props

    account.watch('currencyWallets', () => {
      this.props.updateWalletsRequest()
    })

    account.watch('loggedIn', () => {
      if (account.loggedIn === false) {
        console.log('onLoggedOut')
      }
    })

    account.exchangeCache.on('update', () => {
      this.props.updateExchangeRates()
    })

    // Not implemented yet

    // account.watch('otpDrift', () => {
    //   console.log('otpDrift')
    // })

    // account.watch('remoteOtpChanged', () => {
    //   console.log('remoteOtpChanged')
    // })

    // account.watch('remotePasswordChanged', () => {
    //   console.log('remotePasswordChanged')
    // })

    // account.watch('onDataChanged', () => {
    //   console.log('onDataChanged')
    // })
  }
}

const mapStateToProps = (state: State): EdgeAccountCallbackManagerStateProps => {
  return {
    account: state.core.account
  }
}

const mapDispatchToProps = (dispatch: Dispatch): EdgeAccountCallbackManagerDispatchProps => {
  return {
    updateWalletsRequest: () => dispatch(updateWalletsRequest()),
    updateExchangeRates: () => dispatch(updateExchangeRates())
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EdgeAccountCallbackManager)
