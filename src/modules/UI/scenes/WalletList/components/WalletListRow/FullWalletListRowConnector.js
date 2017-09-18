import {connect} from 'react-redux'
import FullWalletListRow from './FullWalletListRow.ui'

import {selectWallet} from '../../../../Wallets/action'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'

const mapStateToProps = (state, ownProps) => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)

  return {
    dimensions: state.ui.scenes.dimensions,
    displayDenomination,
    exchangeDenomination
  }
}
const mapDispatchToProps = (dispatch) => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(FullWalletListRow)
