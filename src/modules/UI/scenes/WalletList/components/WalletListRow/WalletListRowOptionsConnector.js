// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes.js'
// $FlowFixMe
import UI_SELECTORS from '../../../../selectors'
// $FlowFixMe
import { updateRenameWalletInput } from '../../action'
import WalletListRowOptions from './WalletListRowOptions.ui'

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
