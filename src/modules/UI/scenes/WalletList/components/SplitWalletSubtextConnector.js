import {connect} from 'react-redux'
import SplitWalletSubtext from './SplitWalletSubtext.ui'

import { getWalletName } from '../../../../Core/selectors'

export default connect((state) => ({
  currentWalletBeingSplited: getWalletName(state, state.ui.scenes.walletList.walletId)
}))(SplitWalletSubtext)
