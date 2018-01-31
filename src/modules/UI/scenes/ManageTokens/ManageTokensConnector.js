// @flow

import {connect} from 'react-redux'

import ManageTokens from './ManageTokens.ui.js'

import {setEnabledTokens} from '../../Wallets/action.js'
import type {GuiWallet, CustomTokenInfo} from '../../../../types'
import type {State} from '../../../ReduxTypes'

import {getManageTokensPending} from '../../Wallets/selectors.js'
import {getCustomTokens} from '../../Settings/selectors.js'

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
  manageTokensPending: getManageTokensPending(state),
  guiWallet: ownProps.guiWallet,
  settingsCustomTokens: getCustomTokens(state)
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) => dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
