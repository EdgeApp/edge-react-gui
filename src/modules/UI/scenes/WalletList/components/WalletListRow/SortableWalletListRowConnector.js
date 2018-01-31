import {connect} from 'react-redux'
import SortableWalletListRow from './SortableWalletListRow.ui'
import {
  getDisplayDenomination,
  getExchangeDenomination
} from '../../../../Settings/selectors'
import {getDimensions} from '../../../../dimensions/selectors.js'

const mapStateToProps = (state, ownProps) => {
  const displayDenomination = getDisplayDenomination(state, ownProps.data.currencyCode)
  const exchangeDenomination = getExchangeDenomination(state, ownProps.data.currencyCode)
  return {
    dimensions: getDimensions(state),
    displayDenomination,
    exchangeDenomination
  }
}

const mapDispatchToProps = () => ({})

export default connect(mapStateToProps, mapDispatchToProps)(SortableWalletListRow)
