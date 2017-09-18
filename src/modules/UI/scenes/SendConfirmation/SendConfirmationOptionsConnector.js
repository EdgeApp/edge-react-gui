import {connect} from 'react-redux'
import SendConfirmationOptions from './SendConfirmationOptions'

import {openHelpModal} from '../../components/HelpModal/actions.js'

const mapStateToProps = () => ({})

const mapDispatchToProps = (dispatch) => ({
  openHelpModal : () => dispatch(openHelpModal())
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmationOptions)
