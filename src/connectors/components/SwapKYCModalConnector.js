// @flow

import { connect } from 'react-redux'

import { setKycToken } from '../../actions/CryptoExchangeActions.js'
import { SwapKYCModal } from '../../components/modals/SwapKYCModal.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State) => {
  return {
    showKYCAlert: state.cryptoExchange.showKYCAlert
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  setToken: (tokenInfo: { accessToken: string, refreshToken: string }) => dispatch(setKycToken(tokenInfo))
})

const SwapKYCModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SwapKYCModal)

export { SwapKYCModalConnector }
