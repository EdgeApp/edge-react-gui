// @flow

import {connect} from 'react-redux'

import WalletListRowOptions from './WalletListRowOptions.ui'
// $FlowFixMe
import {updateRenameWalletInput} from '../../action'
// $FlowFixMe
import UI_SELECTORS from '../../../../selectors'
import type {State, Dispatch} from '../../../../../ReduxTypes.js'

const mapStateToProps = (state: State) => ({
  wallets: UI_SELECTORS.getWallets(state),
  // $FlowFixMe
  archives: state.ui.wallets.archives
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateRenameWalletInput: (input) => dispatch(updateRenameWalletInput(input))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListRowOptions)
