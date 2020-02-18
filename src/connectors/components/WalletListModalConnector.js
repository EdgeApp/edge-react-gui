// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/modals/WalletListModal.js'
import { WalletListModal } from '../../components/modals/WalletListModal.js'
import { getActiveWalletIds, getHiddenWalletIds } from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State): StateProps => {
  const wallets = state.ui.wallets.byId
  const hiddenWalletIds = getHiddenWalletIds(state)
  const activeWalletIds = getActiveWalletIds(state)
    .filter(id => !(wallets[id] != null && wallets[id].type === 'wallet:fio'))
    .filter(id => !hiddenWalletIds.includes(id))
  const { mostRecentWallets } = state.ui.settings
  return {
    activeWalletIds,
    mostRecentWallets
  }
}

const WalletListModalConnected = connect(mapStateToProps)(WalletListModal)

export { WalletListModalConnected }
