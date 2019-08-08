// @flow

import { connect } from 'react-redux'

import { deactivateShapeShift } from '../actions/ShapeShiftActions.js'
import { ExchangeSettingsComponent } from '../components/scenes/ExchangeSettingsScene.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

export const ExchangeSettingsConnector = connect(
  (state: State) => ({
    exchanges: state.core.account.swapConfig,
    shapeShiftNeedsKYC: state.ui.settings.shapeShiftNeedsKYC
  }),
  (dispatch: Dispatch) => ({
    shapeShiftLogOut () {
      dispatch(deactivateShapeShift())
    }
  })
)(ExchangeSettingsComponent)
