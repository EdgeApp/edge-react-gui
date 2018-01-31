// @flow
import {connect} from 'react-redux'
import WalletList from './WalletList.ui'
import {
  updateActiveWalletsOrder,
  updateArchivedWalletsOrder
} from './action'

import { walletRowOption } from './components/WalletOptions/action.js'
import type { Dispatch, State } from '../../../ReduxTypes'
import {setContactList} from '../../contacts/action'
import {getCurrencyConverter, getWallets as getCoreWallets} from '../../../Core/selectors.js'
import {getWallets, getActiveWalletIds, getArchivedWalletIds} from '../../selectors.js'
import {getSettings, getCustomTokens} from '../../Settings/selectors'

import {getWalletArchiveVisible, getWalletName, getWalletId} from './selectors.js'
import {getDimensions} from '../../dimensions/selectors.js'

const mapStateToProps = (state: State) => {
  const currencyConverter = getCurrencyConverter(state)
  const settings = getSettings(state)
  const coreWallets = getCoreWallets(state)
  const wallets = getWallets(state)
  const activeWalletIds = getActiveWalletIds(state)
  const archivedWalletIds = getArchivedWalletIds(state)
  const walletArchivesVisible = getWalletArchiveVisible(state)
  const walletName = getWalletName(state)
  const walletId = getWalletId(state)
  // $FlowFixMe
  const walletOrder = state.ui.wallets.walletListOrder
  const dimensions = getDimensions(state)
  const customTokens = getCustomTokens(state)
  return {
    settings,
    coreWallets,
    wallets,
    activeWalletIds,
    archivedWalletIds,
    walletArchivesVisible,
    walletName,
    walletId,
    walletOrder,
    currencyConverter,
    dimensions,
    customTokens
  }
}

const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateActiveWalletsOrder: (activeWalletIds) => dispatch(updateActiveWalletsOrder(activeWalletIds)),
  updateArchivedWalletsOrder: (archivedWalletIds) => dispatch(updateArchivedWalletsOrder(archivedWalletIds)),
  setContactList: (contacts) => dispatch(setContactList(contacts)),
  // $FlowFixMe
  walletRowOption: (walletId, option, archived) => dispatch(walletRowOption(walletId, option, archived))
})

export default connect(mapStateToProps, mapDispatchToProps)(WalletList)
