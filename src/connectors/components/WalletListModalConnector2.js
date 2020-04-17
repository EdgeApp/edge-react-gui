// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/modals/WalletListModal2.js'
import { WalletListModal } from '../../components/modals/WalletListModal2.js'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State): StateProps => {
  const wallets = state.ui.wallets.byId
  const { mostRecentWallets } = state.ui.settings
  let activeWalletIds = getActiveWalletIds(state)
  if (global.isFioDisabled) {
    activeWalletIds = getActiveWalletIds(state).filter(id => !(wallets[id] != null && wallets[id].type === 'wallet:fio'))
  }

  return {
    activeWalletIds,
    mostRecentWallets
  }
}

const WalletListModalConnected = connect(mapStateToProps)(WalletListModal)

export { WalletListModalConnected }
