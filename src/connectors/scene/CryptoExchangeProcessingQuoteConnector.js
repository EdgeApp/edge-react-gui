// @flow
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { EXCHANGE_QUOTE_PROCESSING_SCENE } from '../../constants/indexConstants.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { CryptoExchangeQuoteProcessingScreenComponent } from '../../modules/UI/scenes/CryptoExchange/CryptoExchangeQuoteProcessingScreenComponent'

export const mapStateToProps = (state: State) => {
  return {
    shiftPendingTransaction: state.cryptoExchange.shiftPendingTransaction
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  processingComplete: () => Actions[EXCHANGE_QUOTE_PROCESSING_SCENE](),
  processingError: () => Actions[EXCHANGE_QUOTE_PROCESSING_SCENE]()
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CryptoExchangeQuoteProcessingScreenComponent)
