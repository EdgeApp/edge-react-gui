// @flow

import { connect } from 'react-redux'

// import * as Constants from '../../constants/indexConstants.js'
import * as actions from '../../actions/indexActions'
import { COMPLETE_ONBOARDING } from '../../constants/indexConstants.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import { OnBoardingComponent } from '../../modules/UI/scenes/OnBoarding/OnBoardingComponent.js'

export const mapStateToProps = (state: State) => ({
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  finishOnBoarding: () => dispatch(actions.dispatchActionOnly(COMPLETE_ONBOARDING))
})

export default connect(mapStateToProps, mapDispatchToProps)(OnBoardingComponent)
