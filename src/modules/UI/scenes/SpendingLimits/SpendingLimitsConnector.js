// @flow

import { connect } from 'react-redux'

import type { State } from '../../../ReduxTypes.js'
import { getFiatSymbol } from '../../../utils.js'
import type { SpendingLimits as SpendingLimitsType } from '../../Settings/spendingLimits/SpendingLimitsReducer.js'
import { SpendingLimitsComponent } from './SpendingLimits.ui.js'
import { setSpendingLimits } from './SpendingLimitsActions.js'

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
