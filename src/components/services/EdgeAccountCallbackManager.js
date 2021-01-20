// @flow

import type { EdgeAccount } from 'edge-core-js'
import { watchSecurityAlerts } from 'edge-login-ui-rn'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { SECURITY_ALERTS_SCENE } from '../../constants/SceneKeys.js'
import { updateWalletsRequest } from '../../modules/Core/Wallets/action.js'
import { updateExchangeRates } from '../../modules/ExchangeRates/action.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { Airship } from './AirshipInstance.js'

type EdgeAccountCallbackManagerStateProps = {
  account: EdgeAccount
}

type EdgeAccountCallbackManagerDispatchProps = {
  updateWalletsRequest: () => any,
  updateExchangeRates: () => any
}

type Props = EdgeAccountCallbackManagerStateProps & EdgeAccountCallbackManagerDispatchProps

class EdgeAccountCallbackManager extends React.Component<Props> {
  cleanups: Array<() => mixed> = []
  lastAccount: EdgeAccount | void

  render() {
    return null
  }

  componentDidMount() {
    this.subscribeToAccount()
  }

  componentDidUpdate() {
    this.subscribeToAccount()
  }

  componentWillUnmount() {
    this.cleanup()
  }

  cleanup() {
    for (const cleanup of this.cleanups) cleanup()
    this.cleanups = []
  }

  subscribeToAccount = () => {
    const { account } = this.props
    if (account === this.lastAccount) return
    this.lastAccount = account
    this.cleanup()

    // This could be a bogus account object:
    if (account.watch == null) return

    this.cleanups = [
      account.watch('currencyWallets', () => {
        this.props.updateWalletsRequest()
      }),

      account.watch('loggedIn', () => {
        if (account.loggedIn === false) {
          Airship.clear()
          console.log('onLoggedOut')
        }
      }),

      watchSecurityAlerts(account, hasAlerts => {
        if (hasAlerts && Actions.currentScene !== SECURITY_ALERTS_SCENE) {
          Actions.push(SECURITY_ALERTS_SCENE)
        }
      }),

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
    ]
  }
}

const mapStateToProps = (state: RootState): EdgeAccountCallbackManagerStateProps => {
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

export default connect(mapStateToProps, mapDispatchToProps)(EdgeAccountCallbackManager)
