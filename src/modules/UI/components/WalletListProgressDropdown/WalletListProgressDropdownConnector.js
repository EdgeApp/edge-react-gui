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
  let progress = 0
  for (const walletId of ethWalletKeys) {
    const itemWeightedProgress = (wallets[walletId].addressLoadingProgress || 0) / numberOfWallets
    progress += itemWeightedProgress
  }
  const progressSyntax = parseInt(progress * 100).toString() + '%'
  const displayDropdown = progress === 1 ? false : state.ui.walletListProgressDropdown.displayDropdown
  return {
    wallets,
    walletKeys,
    ethWalletKeys,
    numberOfWallets,
    displayDropdown,
    progressSyntax
  }
}
const mapDispatchToProps = (dispatch: Dispatch) => ({
  dismissAlert: () => dispatch(dismissWalletProgressDropdown())
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletListProgressDropdown)
