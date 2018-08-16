// @flow

import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import { getWalletLoadingPercent } from '../../../../selectors.js'
import type { WalletListProgressBarDispatchProps, WalletListProgressBarStateProps } from './WalletListProgressBar.ui.js'
import { WalletListProgressBarComponent } from './WalletListProgressBar.ui.js'

const mapStateToProps = (state: State): WalletListProgressBarStateProps => {
  const progressPercentage = getWalletLoadingPercent(state)
  return {
    progressPercentage
  }
}
const mapDispatchToProps = (dispatch: Dispatch): WalletListProgressBarDispatchProps => {
  return {}
}

export const WalletListProgressBarConnector = connect(mapStateToProps, mapDispatchToProps)(WalletListProgressBarComponent)
