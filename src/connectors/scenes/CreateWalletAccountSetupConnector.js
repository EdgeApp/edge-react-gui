// @flow

import { connect } from 'react-redux'

import { checkHandleAvailability } from '../../actions/CreateWalletActions.js'
import { CreateWalletAccountSetup } from '../../components/scenes/CreateWalletAccountSetupScene'
import type { Dispatch, State } from '../../types/reduxTypes.js'

const mapStateToProps = (state: State) => ({
  isCheckingHandleAvailability: state.ui.scenes.createWallet.isCheckingHandleAvailability,
  handleAvailableStatus: state.ui.scenes.createWallet.handleAvailableStatus
})

const mapDispatchToProps = (dispatch: Dispatch, ownProps) => ({
  checkHandleAvailability: (handle: string) => dispatch(checkHandleAvailability(ownProps.selectedWalletType.currencyCode, handle))
})

export const CreateWalletAccountSetupConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountSetup)
