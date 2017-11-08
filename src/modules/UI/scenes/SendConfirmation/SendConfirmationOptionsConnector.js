import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import SendConfirmationOptions from './SendConfirmationOptions'

import { CHANGE_MINING_FEE_SEND_CONFIRMATION } from '../../../../constants/indexConstants'

import {openHelpModal} from '../../components/HelpModal/actions.js'
import {getMaxSpendable} from './action'

const mapStateToProps = () => ({})

const mapDispatchToProps = (dispatch) => ({
  changeMiningFee : Actions[CHANGE_MINING_FEE_SEND_CONFIRMATION],
  openHelpModal : () => dispatch(openHelpModal()),
  sendMaxSpend : () => dispatch(getMaxSpendable()),
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmationOptions)
