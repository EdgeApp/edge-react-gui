// @flow

import { connect } from 'react-redux'

import { CreateWalletAccountSetup } from '../../components/scenes/CreateWalletAccountSetupScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({

})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletAccountSetupDispatchProps => ({

})

export const CreateWalletAccountSetupConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountSetup)
