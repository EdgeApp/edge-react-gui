// @flow

import { connect } from 'react-redux'

import HelpModal from './HelpModal.ui'
import { closeHelpModal } from './actions.js'

import type { Dispatch, State } from '../../../ReduxTypes'

const mapStateToProps = (state: State) => ({
  modal: state.ui.scenes.helpModal
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeModal: () => dispatch(closeHelpModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(HelpModal)
