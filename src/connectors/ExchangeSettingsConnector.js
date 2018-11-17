// @flow

import { connect } from 'react-redux'

import { ExchangeSettingsComponent } from '../components/scenes/ExchangeSettingsScene.js'
import { getAccount } from '../modules/Core/selectors.js'
import type { Dispatch, State } from '../modules/ReduxTypes.js'

const mapStateToProps = (state: State, ownProps) => {
  const account = getAccount(state)
  return {
    exchanges: account.swapConfig
  }
}
const mapDispatchToProps = (dispatch: Dispatch, ownProps) => {
  return {}
}
export const ExchangeSettingsConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(ExchangeSettingsComponent)
