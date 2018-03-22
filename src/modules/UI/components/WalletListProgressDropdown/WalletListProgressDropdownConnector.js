// @flow

import { connect } from 'react-redux'
import { dismissWalletProgressDropdown } from './action.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import WalletListProgressDropdown from './WalletListProgressDropdown.ui'

const mapStateToProps = (state: State) => {
  const wallets = state.ui.wallets.byId
  const walletKeys = Object.keys(wallets)
  const ethWalletKeys = walletKeys.filter(wallet => wallets[wallet].currencyCode === 'ETH')
  const numberOfWallets = ethWalletKeys.length
  const displayDropdown = state.ui.walletListProgressDropdown.displayDropdown
  return {
    wallets,
    walletKeys,
    ethWalletKeys,
    numberOfWallets,
    displayDropdown
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissWalletProgressDropdown())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListProgressDropdown)
