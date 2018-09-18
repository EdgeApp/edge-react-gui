// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import DeleteModal from './DeleteModal.ui'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList.deleteWalletModalVisible
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: 'CLOSE_DELETE_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DeleteModal)
