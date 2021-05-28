// @flow

import { connect } from 'react-redux'

import { setSpendingLimits } from '../actions/SpendingLimitsActions.js'
import { SpendingLimitsComponent } from '../components/scenes/SpendingLimitsScene.js'
import { type RootState } from '../types/reduxTypes.js'
import { type SpendingLimits as SpendingLimitsType } from '../types/types.js'
import { getFiatSymbol } from '../util/utils.js'

const mapStateToProps = (state: RootState) => ({
  currencySymbol: getFiatSymbol(state.ui.settings.defaultFiat),
  transactionSpendingLimit: state.ui.settings.spendingLimits.transaction
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onSubmit: (spendingLimits: SpendingLimitsType, password: string) => {
    dispatch(setSpendingLimits(spendingLimits, password))
  }
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SpendingLimitsComponent)
