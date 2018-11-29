// @flow

import { type EdgeParsedUri } from 'edge-core-js'
import { connect } from 'react-redux'

import { createAccountTransaction } from '../../actions/CreateWalletActions.js'
import { CreateWalletAccountSelect } from '../../components/scenes/CreateWalletAccountSelectScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { type GuiMakeSpendInfo } from '../../reducers/scenes/SendConfirmationReducer.js'

const mapStateToProps = (state: State) => ({})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletAccountSelectDispatchProps => ({
  createAccountTransaction: (walletId: string, data: GuiMakeSpendInfo | EdgeParsedUri) => dispatch(createAccountTransaction(walletId, data))
})

export const CreateWalletAccountSelectConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountSelect)
