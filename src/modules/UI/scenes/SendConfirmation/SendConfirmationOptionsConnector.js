import {connect} from 'react-redux'
import SendConfirmationOptions from './SendConfirmationOptions'

import {openHelpModal} from '../../components/HelpModal/actions.js'
import {getMaxSpendable} from './action'

const mapStateToProps = () => ({})

const mapDispatchToProps = (dispatch) => ({
  openHelpModal : () => dispatch(openHelpModal()),
  sendMaxSpend : () => dispatch(getMaxSpendable()),
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmationOptions)
