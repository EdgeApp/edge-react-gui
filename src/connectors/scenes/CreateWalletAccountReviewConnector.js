// @flow

import { connect } from 'react-redux'

import { CreateWalletAccountReview } from '../../components/scenes/CreateWalletAccountReviewScene'
import type { Dispatch, State } from '../../modules/ReduxTypes'

const mapStateToProps = (state: State) => ({})

const mapDispatchToProps = (dispatch: Dispatch): CreateWalletAccountReviewDispatchProps => ({})

export const CreateWalletAccountReviewConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletAccountReview)
