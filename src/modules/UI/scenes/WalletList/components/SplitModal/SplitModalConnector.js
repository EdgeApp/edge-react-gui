// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import SplitModal from './SplitModal.ui'

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
