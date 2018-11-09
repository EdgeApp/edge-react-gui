// @flow

import { connect } from 'react-redux'

import { CreateWalletAccountSelect } from '../../components/scenes/CreateWalletAccountSelectScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({

})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletAccountSelectDispatchProps => ({

})

export const CreateWalletAccountSelectConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountSelect)
