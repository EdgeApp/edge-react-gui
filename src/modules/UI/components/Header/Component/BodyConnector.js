import Body from './Body'
import {connect} from 'react-redux'

const mapStateToProps = (state) => ({
  routes: state.routes,
  wallets: state.ui.wallets.byId,
  selectedWalletListModalVisibility: state.ui.scenes.scan
    .selectedWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scenes.scan
    .scanToWalletListModalVisibility
})
export default connect(mapStateToProps)(Body)
