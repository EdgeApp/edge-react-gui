// @flow

import { connect } from 'react-redux'

import type { State } from '../../../../ReduxTypes'
import * as UI_SELECTORS from '../../../selectors.js'
import type { TransactionRowStateProps } from './TransactionRow.ui.js'
import { TransactionRowComponent } from './TransactionRow.ui.js'

const mapStateToProps = (state: State): {} => {
  const selectedWallet = UI_SELECTORS.getSelectedWallet(state)

  const out: TransactionRowStateProps = {
    walletBlockHeight: selectedWallet.blockHeight
  }

  return out
}
const mapDispatchToProps = () => ({})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TransactionRowComponent)
