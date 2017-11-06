import {connect} from 'react-redux'
import DeleteWalletSubtext from './DeleteWalletSubtext.ui'

import { getWalletName } from '../../../../Core/selectors'

export default connect((state) => ({
  currentWalletBeingDeleted: getWalletName(state, state.ui.scenes.walletList.walletId)
}))(DeleteWalletSubtext)
