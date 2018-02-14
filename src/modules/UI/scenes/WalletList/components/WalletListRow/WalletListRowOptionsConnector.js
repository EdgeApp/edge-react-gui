import { connect } from 'react-redux'

import UI_SELECTORS from '../../../../selectors'
import { updateRenameWalletInput } from '../../action'
import WalletListRowOptions from './WalletListRowOptions.ui'

const mapStateToProps = state => ({
  wallets: UI_SELECTORS.getWallets(state),
  archives: state.ui.wallets.archives
})

const mapDispatchToProps = dispatch => ({
  updateRenameWalletInput: input => dispatch(updateRenameWalletInput(input))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListRowOptions)
