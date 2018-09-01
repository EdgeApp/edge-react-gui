// @flow
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../modules/ReduxTypes'
import type { PassedProps } from '../../modules/UI/scenes/TransactionsExport/TransactionsExportSceneComponent.js'
import { TransactionsExportSceneComponent } from '../../modules/UI/scenes/TransactionsExport/TransactionsExportSceneComponent.js'
import { getDisplayDenomination } from '../../modules/UI/Settings/selectors.js'

const mapStateToProps = (state: State, ownProps: PassedProps) => {
  const wallet = ownProps.sourceWallet
  const currencyCode = wallet.currencyInfo.currencyCode
  const denominationObject = getDisplayDenomination(state, currencyCode)
  const denomination = denominationObject.multiplier
  return {
    denomination
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  //
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionsExportSceneComponent)
