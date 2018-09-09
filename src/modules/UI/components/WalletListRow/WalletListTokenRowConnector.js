// @flow
import { connect } from 'react-redux'

import { getCurrencyConverter } from '../../../Core/selectors.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import { WalletListTokenRowComponent } from './WalletListTokenRow.ui.js'
import type { WalletListTokenRowDispatchProps, WalletListTokenRowOwnProps, WalletListTokenRowStateProps } from './WalletListTokenRow.ui.js'

const mapStateToProps = (state: State, ownProps: WalletListTokenRowOwnProps): WalletListTokenRowStateProps => {
  const settings = state.ui.settings
  const currencyConverter = getCurrencyConverter(state)

  return {
    settings,
    currencyConverter
  }
}
const mapDispatchToProps = (dispatch: Dispatch): WalletListTokenRowDispatchProps => {
  return {}
}

export const WalletListTokenRowConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletListTokenRowComponent)
