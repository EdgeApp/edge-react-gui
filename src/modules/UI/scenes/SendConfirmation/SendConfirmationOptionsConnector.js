import { connect } from 'react-redux'
import { Actions } from 'react-native-router-flux'
import SendConfirmationOptions from './SendConfirmationOptions'

import { CHANGE_MINING_FEE_SEND_CONFIRMATION } from '../../../../constants/indexConstants'

import { openHelpModal } from '../../components/HelpModal/actions.js'
import { updateMaxSpend } from './action'

const mapStateToProps = () => ({})

const mapDispatchToProps = (dispatch) => ({
  changeMiningFee: Actions[CHANGE_MINING_FEE_SEND_CONFIRMATION],
  openHelpModal: () => dispatch(openHelpModal()),
  sendMaxSpend: () => dispatch(updateMaxSpend())
})

export default connect(mapStateToProps, mapDispatchToProps)(SendConfirmationOptions)
