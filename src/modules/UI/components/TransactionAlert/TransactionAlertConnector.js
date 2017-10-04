// @flow
import TransactionAlert from './TransactionAlert.ui'
import {connect} from 'react-redux'
import {closeTransactionAlert} from './action.js'

import type {
  State,
  Dispatch
} from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  view: state.ui.scenes.transactionAlert.view,
  message: state.ui.scenes.transactionAlert.message,
  route: state.ui.scenes.transactionAlert.route
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeAlert: () => dispatch(closeTransactionAlert())
})

export default connect(mapStateToProps, mapDispatchToProps)(TransactionAlert)
