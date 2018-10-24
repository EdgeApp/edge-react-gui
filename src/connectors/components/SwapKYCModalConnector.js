// @flow

import { connect } from 'react-redux'

import { setKycToken } from '../../actions/CryptoExchangeActions.js'
import { SwapKYCModal } from '../../components/modals/SwapKYCModal.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State) => {
  return {
    showKYCAlert: state.cryptoExchange.showKYCAlert,
    pluginName: state.cryptoExchange.requireKYCPlugins.length > 0 ? state.cryptoExchange.requireKYCPlugins[0] : ''
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  setToken: (tokenInfo: { access_token: string, refresh_token: string }, pluginName: string) => dispatch(setKycToken(tokenInfo, pluginName))
})

const SwapKYCModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SwapKYCModal)

export { SwapKYCModalConnector }
