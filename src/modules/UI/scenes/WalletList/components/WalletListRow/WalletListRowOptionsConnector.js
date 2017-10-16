import {connect} from 'react-redux'
import WalletListRowOptions from './WalletListRowOptions.ui'
import {updateRenameWalletInput} from '../../action'
import UI_SELECTORS from '../../../../selectors'

const mapStateToProps = (state) => ({
  wallets: UI_SELECTORS.getWallets(state),
  archives: state.ui.wallets.archives
})

const mapDispatchToProps = (dispatch) => ({
  updateRenameWalletInput: (input) => dispatch(updateRenameWalletInput(input))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListRowOptions)
