// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/modals/WalletListModal2.js'
import { WalletListModal } from '../../components/modals/WalletListModal2.js'
import { getPlugins } from '../../modules/Settings/selectors.js'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State): StateProps => {
  const wallets = state.ui.wallets.byId
  let activeWalletIds = getActiveWalletIds(state)
  if (global.isFioDisabled) {
    activeWalletIds = getActiveWalletIds(state).filter(id => !(wallets[id] != null && wallets[id].type === 'wallet:fio'))
  }

  return {
    wallets,
    activeWalletIds,
    mostRecentWallets: state.ui.settings.mostRecentWallets,
    allCurrencyInfos: getPlugins(state).allCurrencyInfos
  }
}

const WalletListModalConnected = connect(mapStateToProps)(WalletListModal)

export { WalletListModalConnected }
