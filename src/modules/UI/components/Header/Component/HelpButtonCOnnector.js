import {connect} from 'react-redux'
import HelpButton from './HelpButton.ui'
import {openHelpModal} from '../../HelpModal/actions'

const mapStateToProps = () => ({})
const mapDispatchToProps = (dispatch) => ({
  openHelpModal: () => dispatch(openHelpModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(HelpButton)
