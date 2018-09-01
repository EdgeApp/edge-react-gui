// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../ReduxTypes'
import { closeHelpModal } from './actions.js'
import HelpModal from './HelpModal.ui'

const mapStateToProps = (state: State) => ({
  modal: state.ui.scenes.helpModal
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeModal: () => dispatch(closeHelpModal())
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HelpModal)
