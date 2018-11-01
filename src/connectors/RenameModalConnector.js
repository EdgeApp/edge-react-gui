// @flow

import { connect } from 'react-redux'

import RenameModal from '../components/modals/RenameModal'
import type { Dispatch, State } from '../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList.renameWalletModalVisible,
  walletName: state.ui.scenes.walletList.walletName
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: 'CLOSE_RENAME_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RenameModal)
