// @flow

import { connect } from 'react-redux'

import { activateShapeShift } from '../../actions/ShapeShiftActions.js'
import { SwapKYCModal } from '../../components/modals/SwapKYCModal.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'

export const SwapKYCModalConnector = connect(
  (state: State) => ({}),
  (dispatch: Dispatch) => ({
    activateShapeShift (oauthCode: string) {
      dispatch(activateShapeShift(oauthCode))
    }
  })
)(SwapKYCModal)
