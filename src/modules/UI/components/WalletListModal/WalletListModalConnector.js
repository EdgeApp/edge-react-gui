// @flow

import { connect } from 'react-redux'

import type { State } from '../../../../types/reduxTypes.js'
import WalletListModal from './WalletListModal.ui'

const mapStateToProps = (state: State, ownProps: any) => {
  const whichWallet = ownProps.whichWallet ? ownProps.whichWallet : null
  const wallets = ownProps.wallets || state.ui.wallets.byId
  return {
    type: ownProps.type,
    whichWallet,
    walletList: state.ui.wallets.byId,
    wallets
  }
}

// const mapDispatchToProps = () => ({})
export default connect(
  mapStateToProps,
  {}
)(WalletListModal)
