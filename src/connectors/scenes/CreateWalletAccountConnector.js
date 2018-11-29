// @flow

import { connect } from 'react-redux'

import { CreateWalletAccount } from '../../components/scenes/CreateWalletAccountScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletReviewDispatchProps => ({})

export const CreateWalletAccountConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccount)
