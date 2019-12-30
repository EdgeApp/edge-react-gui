// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/modals/WalletListModal'
import { WalletListModal } from '../../components/modals/WalletListModal'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State): StateProps => {
  const wallets = state.ui.wallets.byId
  const activeWalletIds = getActiveWalletIds(state).filter(id => !(wallets[id] != null && wallets[id].type === 'wallet:fio'))
  return {
    state,
    activeWalletIds
  }
}

const WalletListModalConnected = connect(mapStateToProps)(WalletListModal)

export { WalletListModalConnected }
