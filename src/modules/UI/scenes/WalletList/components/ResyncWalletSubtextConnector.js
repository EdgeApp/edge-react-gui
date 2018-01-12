import {connect} from 'react-redux'
import ResyncWalletSubtext from './ResyncWalletSubtext.ui'

import { getWalletName } from '../../../../Core/selectors'

export default connect((state) => ({
  currentWalletBeingResynced: getWalletName(state, state.ui.scenes.walletList.walletId)
}))(ResyncWalletSubtext)
