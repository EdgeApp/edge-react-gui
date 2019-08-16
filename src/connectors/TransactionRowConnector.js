// @flow

import { connect } from 'react-redux'

import type { TransactionRowStateProps } from '../components/common/TransactionRow.js'
import { TransactionRowComponent } from '../components/common/TransactionRow.js'
import * as UI_SELECTORS from '../modules/UI/selectors.js'
import type { State } from '../types/reduxTypes.js'

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
