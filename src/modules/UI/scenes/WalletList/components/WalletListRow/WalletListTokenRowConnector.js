// @flow

import {connect} from 'react-redux'
import type {AbcDenomination} from 'edge-login'

import type {Dispatch, State} from '../../../../../ReduxTypes'

import WalletListTokenRow from './WalletListTokenRow.ui'
import {getDisplayDenominationFull} from '../../../../Settings/selectors'
import {selectWallet} from '../../../../Wallets/action'

const mapStateToProps = (state: State, ownProps) => {
  const currencyCode: string = ownProps.currencyCode
  // $FlowFixMe
  const displayDenomination: AbcDenomination = getDisplayDenominationFull(state, currencyCode)

  return {
    displayDenomination
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListTokenRow)
