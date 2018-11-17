// @flow

import { connect } from 'react-redux'

import { setSpendingLimits } from '../actions/SpendingLimitsActions.js'
import { SpendingLimitsComponent } from '../components/scenes/SpendingLimitsScene.js'
import type { State } from '../modules/ReduxTypes.js'
import type { SpendingLimits as SpendingLimitsType } from '../reducers/SpendingLimitsReducer.js'
import { getFiatSymbol } from '../util/utils.js'

export const mapStateToProps = (state: State) => ({
  currencySymbol: getFiatSymbol(state.ui.settings.defaultFiat),
  transactionSpendingLimit: state.ui.settings.spendingLimits.transaction
})
export const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (spendingLimits: SpendingLimitsType, password: string) => {
    dispatch(setSpendingLimits(spendingLimits, password))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SpendingLimitsComponent)
