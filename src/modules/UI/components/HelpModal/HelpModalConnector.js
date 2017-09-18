import {connect} from 'react-redux'
import HelpModal from './HelpModal.ui'
import {closeHelpModal} from './actions.js'

const mapStateToProps = (state) => ({
  modal: state.ui.scenes.helpModal,
  routes: state.routes
})

const mapDispatchToProps = (dispatch) => ({
  closeModal: () => dispatch(closeHelpModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(HelpModal)
