// @flow

import {connect} from 'react-redux'
import ManageTokens, {
  type ManageTokensOwnProps,
  type ManageTokensDispatchProps,
  type ManageTokensStateProps
} from './ManageTokens.ui.js'
import {setEnabledTokens} from '../../Wallets/action.js'
import type {State} from '../../../ReduxTypes'

const mapStateToProps = (state: State, ownProps: ManageTokensOwnProps): ManageTokensStateProps => ({
  manageTokensPending: state.ui.wallets.manageTokensPending,
  guiWallet: ownProps.guiWallet,
  settingsCustomTokens: state.ui.settings.customTokens
})
const mapDispatchToProps = (dispatch: Dispatch): ManageTokensDispatchProps => ({
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) => dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
