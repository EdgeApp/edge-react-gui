// @flow

import {connect} from 'react-redux'
import type {AbcDenomination} from 'airbitz-core-types'

import type {Dispatch, State} from '../../../../../ReduxTypes'

import WalletListTokenRow from './WalletListTokenRow.ui'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import {selectWallet} from '../../../../Wallets/action'

const mapStateToProps = (state: State, ownProps) => {
  let currencyCode: string = ownProps.currencyCode
  let displayDenomination: AbcDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)

  return {
    displayDenomination
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListTokenRow)
