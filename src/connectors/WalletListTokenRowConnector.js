// @flow

import { connect } from 'react-redux'

import { selectWallet } from '../actions/WalletActions'
import type { DispatchProps } from '../components/common/WalletListTokenRow.js'
import { WalletListTokenRow } from '../components/common/WalletListTokenRow.js'
import { type Dispatch } from '../types/reduxTypes.js'

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})

export default connect(null, mapDispatchToProps)(WalletListTokenRow)
