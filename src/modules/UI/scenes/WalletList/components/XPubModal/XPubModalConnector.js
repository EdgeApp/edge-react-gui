// @flow

import { connect } from 'react-redux'

import * as Constants from '../../../../../../constants/indexConstants.js'
import type { Dispatch, State } from '../../../../../ReduxTypes'
import { CLOSE_MODAL_VALUE, VISIBLE_MODAL_NAME } from '../WalletOptions/action'
import XPubModal from './XPubModal.ui'

const mapStateToProps = (state: State) => {
  const visibleModalNameInput = Constants.VIEW_XPUB_VALUE
  const visibleModalNameOutput = VISIBLE_MODAL_NAME(visibleModalNameInput)

  const xPubSyntax = state.ui.scenes.walletList.xPubSyntax
  return {
    visibilityBoolean: state.ui.scenes.walletList[visibleModalNameOutput],
    xPubSyntax
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => {
  const input = Constants.VIEW_XPUB_VALUE
  const output = CLOSE_MODAL_VALUE(input)
  return {
    onExit: () => dispatch({ type: output })
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(XPubModal)
