// @flow
import { connect } from 'react-redux'

import type { PassedProps } from '../../components/scenes/TransactionsExportScene.js'
import { TransactionsExportSceneComponent } from '../../components/scenes/TransactionsExportScene.js'
import { getDisplayDenomination } from '../../modules/Settings/selectors.js'
import type { Dispatch, State } from '../../types/reduxTypes.js'

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
