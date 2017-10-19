import {connect} from 'react-redux'
import Header from './Header.ui'

const mapStateToProps = (state) => ({
  routes: state.routes,
  wallets: state.ui.wallets.byId,
  selectedWalletListModalVisibility: state.ui.scenes.scan
    .selectedWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scenes.scan
    .scanToWalletListModalVisibility
})

export default connect(mapStateToProps)(Header)
