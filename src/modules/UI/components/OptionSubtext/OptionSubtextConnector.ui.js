import {connect} from 'react-redux'
import OptionSubtextModal from './OptionSubtextModal.ui'
import { getWalletName } from '../../Core/selectors'

export default connect((state) => ({
  currentWallet: getWalletName(state, state.ui.scenes.walletList.walletId)
}))(OptionSubtextModal)
