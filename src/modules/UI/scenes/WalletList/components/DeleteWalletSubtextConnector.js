import {connect} from 'react-redux'
import DeleteWalletSubtext from './DeleteWalletSubtext.ui'

export default connect((state) => ({
  currentWalletBeingDeleted: state.ui.scenes.walletList.currentWalletBeingDeleted
}))(DeleteWalletSubtext)
