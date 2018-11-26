// @flow

import type { EdgeAccount } from 'edge-core-js'
import { connect } from 'react-redux'

import { ExchangeSettingsComponent } from '../components/scenes/ExchangeSettingsScene.js'
import { getAccount } from '../modules/Core/selectors.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

const mapStateToProps = (state: State, ownProps) => {
  const account = getAccount(state)
  return {
    exchanges: account.swapConfig,
    shapeShiftNeedsKYC: state.ui.settings.shapeShiftNeedsKYC,
    account
  }
}
const mapDispatchToProps = (dispatch: Dispatch, ownProps) => {
  return {
    shapeShiftLogOut: (account: EdgeAccount) => {
      account.swapConfig['shapeshift'].changeUserSettings({})
      dispatch({ type: 'NEED_KYC' })
    }
  }
}
export const ExchangeSettingsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(ExchangeSettingsComponent)
