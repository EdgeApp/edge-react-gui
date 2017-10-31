import {connect} from 'react-redux'
import DeleteWalletSubtext from './DeleteWalletSubtext.ui'

import { getWalletName } from '../../../../Core/selectors'

export default connect((state) => {
  const { walletId } = state.ui.scenes.walletList

  return {
    currentWalletBeingDeleted: getWalletName(state, walletId)
  }
})(DeleteWalletSubtext)
