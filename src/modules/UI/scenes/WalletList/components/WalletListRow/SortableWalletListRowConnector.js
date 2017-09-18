import {connect} from 'react-redux'
import SortableWalletListRow from './SortableWalletListRow.ui'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'

const mapStateToProps = (state, ownProps) => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.currencyCode)
  return {
    dimensions: state.ui.scenes.dimensions,
    displayDenomination,
    exchangeDenomination
  }
}

const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(SortableWalletListRow)
