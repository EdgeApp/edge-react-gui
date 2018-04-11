// @flow

import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import * as Constants from '../../constants/indexConstants'
import { exchangeTimerExpired } from '../../actions/indexActions'
import { CircleTimer } from '../../components/CircleTimer'
import type { State, Dispatch } from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State) => {
  const expiration = Actions.currentScene === Constants.EXCHANGE_SCENE ? state.cryptoExchange.quoteExpireDate : null
  return {
    expiration
  }
}
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  timeExpired: () => dispatch(exchangeTimerExpired())
})
export default connect(mapStateToProps, mapDispatchToProps)(CircleTimer)
