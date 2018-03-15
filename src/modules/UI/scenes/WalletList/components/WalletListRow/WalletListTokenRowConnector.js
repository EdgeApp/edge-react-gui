// @flow

import type { EdgeDenomination } from 'edge-core-js'
import { connect } from 'react-redux'

import type { Dispatch, State } from '../../../../../ReduxTypes'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import { selectWallet } from '../../../../Wallets/action'
import WalletListTokenRow from './WalletListTokenRow.ui'

const mapStateToProps = (state: State, ownProps) => {
  const currencyCode: string = ownProps.currencyCode
  // $FlowFixMe
  const displayDenomination: EdgeDenomination = SETTINGS_SELECTORS.getDisplayDenominationFull(state, currencyCode)

  return {
    displayDenomination
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListTokenRow)
