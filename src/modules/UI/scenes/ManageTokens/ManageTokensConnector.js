// @flow

import {connect} from 'react-redux'
import type {AbcMetaToken} from 'airbitz-core-types'

import ManageTokens from './ManageTokens.ui.js'

import {getEnabledTokens, setEnabledTokens} from '../../Wallets/action.js'
import type {GuiWallet} from '../../../../types'
import type {State} from '../../../ReduxTypes'

export type StateProps = {
  guiWallet: GuiWallet,
  manageTokensPending: boolean,
  accountMetaTokenInfo: Array<AbcMetaToken>
}
export type DispatchProps = {
  getEnabledTokensList: (string) => void,
  setEnabledTokensList: (string, Array<string>, Array<string>) => void
}
export type OwnProps = {guiWallet: GuiWallet}

const mapStateToProps = (state: State, ownProps: OwnProps): StateProps => ({
  manageTokensPending: state.ui.wallets.manageTokensPending,
  guiWallet: ownProps.guiWallet,
  accountMetaTokenInfo: state.ui.something
})
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  getEnabledTokensList: (walletId: string) => dispatch(getEnabledTokens(walletId)),
  setEnabledTokensList: (walletId: string, enabledTokens: Array<string>, oldEnabledTokensList: Array<string>) => dispatch(setEnabledTokens(walletId, enabledTokens, oldEnabledTokensList))
})
export default connect(mapStateToProps, mapDispatchToProps)(ManageTokens)
