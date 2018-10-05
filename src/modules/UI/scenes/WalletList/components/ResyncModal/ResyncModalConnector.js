// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import ResyncModal from './ResyncModal.ui'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList.resyncWalletModalVisible
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: 'CLOSE_RESYNC_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ResyncModal)
