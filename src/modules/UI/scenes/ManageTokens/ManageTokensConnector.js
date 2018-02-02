// @flow

import {connect} from 'react-redux'
import ManageTokens, {
  type ManageTokensOwnProps,
  type ManageTokensDispatchProps,
  type ManageTokensStateProps
} from './ManageTokens.ui.js'
import {setEnabledTokens} from '../../Wallets/action.js'
import type {State} from '../../../ReduxTypes'
import {getManageTokensPending} from '../../Wallets/selectors.js'
import {getCustomTokens} from '../../Settings/selectors.js'

const mapStateToProps = (state: State, ownProps: ManageTokensOwnProps): ManageTokensStateProps => ({
  manageTokensPending: getManageTokensPending(state),
  guiWallet: ownProps.guiWallet,
  settingsCustomTokens: getCustomTokens(state)
})
const mapDispatchToProps = (dispatch: Dispatch): ManageTokensDispatchProps => ({
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) => dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
