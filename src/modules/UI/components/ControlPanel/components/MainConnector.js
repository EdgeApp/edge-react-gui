// @flow

import { connect } from 'react-redux'

import { selectWalletFromModal } from '../../../../../actions/WalletActions.js'
import { type Dispatch, type RootState } from '../../../../../types/reduxTypes.js'
import { logoutRequest } from '../../../../Login/action'
import Main from './Main'

const mapStateToProps = (state: RootState) => ({
  usersView: state.ui.scenes.controlPanel.usersView
})
const mapDispatchToProps = (dispatch: Dispatch) => ({
  logout: (username?: string) => dispatch(logoutRequest(username)),
  onSelectWallet: (walletId: string, currencyCode: string) => dispatch(selectWalletFromModal(walletId, currencyCode))
})

export default connect(mapStateToProps, mapDispatchToProps)(Main)
