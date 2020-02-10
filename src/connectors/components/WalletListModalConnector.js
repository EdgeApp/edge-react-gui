// @flow

import { connect } from 'react-redux'

import type { StateProps } from '../../components/modals/WalletListModal.js'
import { WalletListModal } from '../../components/modals/WalletListModal.js'
import { getActiveWalletIds } from '../../modules/UI/selectors.js'
import type { State } from '../../types/reduxTypes.js'

export const mapStateToProps = (state: State): StateProps => {
  const activeWalletIds = getActiveWalletIds(state)
  const { mostRecentWallets } = state.ui.settings
  return {
    activeWalletIds,
    mostRecentWallets
  }
}

const WalletListModalConnected = connect(mapStateToProps)(WalletListModal)

export { WalletListModalConnected }
