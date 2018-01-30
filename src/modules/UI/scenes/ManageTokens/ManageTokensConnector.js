// @flow

import {connect} from 'react-redux'

import ManageTokens from './ManageTokens.ui.js'

import {setEnabledTokens} from '../../Wallets/action.js'
import type {GuiWallet, CustomTokenInfo} from '../../../../types'
import type {State} from '../../../ReduxTypes'

export type StateProps = {
  guiWallet: GuiWallet,
  manageTokensPending: boolean,
  settingsCustomTokens: Array<CustomTokenInfo>
}
export type DispatchProps = {
  setEnabledTokensList: (string, Array<string>, Array<string>) => void
}
export type OwnProps = {guiWallet: GuiWallet}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
  manageTokensPending: state.ui.wallets.manageTokensPending,
  guiWallet: ownProps.guiWallet,
  settingsCustomTokens: state.ui.settings.customTokens
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) => dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
