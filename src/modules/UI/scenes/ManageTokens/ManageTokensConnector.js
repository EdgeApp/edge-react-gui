// @flow

import { connect } from 'react-redux'

import type { State } from '../../../ReduxTypes'
import { setEnabledTokens } from '../../Wallets/action.js'
import ManageTokens from './ManageTokens.ui.js'
import type { ManageTokensDispatchProps, ManageTokensOwnProps, ManageTokensStateProps } from './ManageTokens.ui.js'

const mapStateToProps = (state: State, ownProps: ManageTokensOwnProps): ManageTokensStateProps => ({
  manageTokensPending: state.ui.wallets.manageTokensPending,
  guiWallet: ownProps.guiWallet,
  settingsCustomTokens: state.ui.settings.customTokens
})
const mapDispatchToProps = (dispatch: Dispatch): ManageTokensDispatchProps => ({
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) =>
    dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
})
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ManageTokens)
