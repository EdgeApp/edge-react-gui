// @flow

import { connect } from 'react-redux'

import { CreateWalletAccountLogin } from '../../components/scenes/CreateWalletAccountLoginScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({

})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletAccountLoginDispatchProps => ({

})

export const CreateWalletAccountLoginConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountLogin)
