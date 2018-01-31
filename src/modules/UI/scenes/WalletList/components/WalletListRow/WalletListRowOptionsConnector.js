// @flow

import {connect} from 'react-redux'

import WalletListRowOptions from './WalletListRowOptions.ui'
// $FlowFixMe
import {updateRenameWalletInput} from '../../action'
import {getWallets} from '../../../../selectors'

import type {State, Dispatch} from '../../../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  wallets: getWallets(state),
  // $FlowFixMe
  archives: state.ui.wallets.archives
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateRenameWalletInput: (input) => dispatch(updateRenameWalletInput(input))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListRowOptions)
