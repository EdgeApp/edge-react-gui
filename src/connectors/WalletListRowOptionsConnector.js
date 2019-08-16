// @flow

import { connect } from 'react-redux'

// $FlowFixMe
import { updateRenameWalletInput } from '../actions/WalletListActions'
import WalletListRowOptions from '../components/common/WalletListRowOptions'
// $FlowFixMe
import UI_SELECTORS from '../modules/UI/selectors'
import type { Dispatch, State } from '../types/reduxTypes.js'

const mapStateToProps = (state: State) => ({
  wallets: UI_SELECTORS.getWallets(state),
  // $FlowFixMe
  archives: state.ui.wallets.archives
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateRenameWalletInput: input => dispatch(updateRenameWalletInput(input))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListRowOptions)
