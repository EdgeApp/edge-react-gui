// @flow

import { connect } from 'react-redux'

import SplitModal from '../components/modals/SplitModal'
import type { Dispatch, State } from '../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList.splitWalletModalVisible
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExitButtonFxn: () => dispatch({ type: 'CLOSE_SPLIT_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SplitModal)
