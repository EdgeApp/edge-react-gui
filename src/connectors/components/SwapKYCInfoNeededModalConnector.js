// @flow

import { connect } from 'react-redux'

import { SwapKYCInfoNeededModal } from '../../components/modals/SwapKYCInfoNeededModal'
import type { Dispatch, State } from '../../modules/ReduxTypes'

export const mapStateToProps = (state: State) => {
  return {
    pluginName: state.cryptoExchange.pluginCompleteKYC
  }
}

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeFinishKYCModal: () => dispatch({ type: 'NEED_FINISH_KYC_OFF' })
})

const SwapKYCInfoNeededModalConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SwapKYCInfoNeededModal)

export { SwapKYCInfoNeededModalConnector }
