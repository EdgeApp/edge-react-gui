// @flow

import { connect } from 'react-redux'

import XPubModal from '../components/modals/XPubModal'
import type { Dispatch, State } from '../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({
  visibilityBoolean: state.ui.scenes.walletList.viewXPubWalletModalVisible,
  xPubSyntax: state.ui.scenes.walletList.xPubSyntax
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  onExit: () => dispatch({ type: 'CLOSE_VIEWXPUB_WALLET_MODAL' })
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(XPubModal)
