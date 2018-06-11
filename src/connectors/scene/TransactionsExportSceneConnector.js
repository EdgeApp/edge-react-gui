// @flow
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../modules/ReduxTypes'
import { TransactionsExportSceneComponent } from '../../modules/UI/scenes/TransactionsExport/TransactionsExportSceneComponent.js'
const mapStateToProps = (state: State) => {
  return {}
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  // fetchMoreTransactions: (walletId: string, currencyCode: string) => dispatch(fetchMoreTransactions(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionsExportSceneComponent)
