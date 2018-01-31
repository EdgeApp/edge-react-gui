// @flow

import {connect} from 'react-redux'

import RenameModal from './RenameModal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import type {Dispatch, State} from '../../../../../ReduxTypes'
import { VISIBLE_MODAL_NAME, CLOSE_MODAL_VALUE } from '../WalletOptions/action'
import {getWalletName} from '../../selectors.js'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList[VISIBLE_MODAL_NAME(Constants.RENAME_VALUE)],
  walletName: getWalletName(state)
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: CLOSE_MODAL_VALUE(Constants.RENAME_VALUE) })
})

export default connect(mapStateToProps, mapDispatchToProps)(RenameModal)
