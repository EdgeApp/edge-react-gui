// @flow

import { connect } from 'react-redux'

import HelpModal from './HelpModal.ui'
import { closeHelpModal } from './actions.js'

import type { Dispatch, State } from '../../../ReduxTypes'

import {getHelpModal} from './selectors.js'

const mapStateToProps = (state: State) => ({
  modal: getHelpModal(state)
})

const mapDispatchToProps = (dispatch: Dispatch) => ({
  closeModal: () => dispatch(closeHelpModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(HelpModal)
