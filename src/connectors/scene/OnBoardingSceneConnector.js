// @flow

import { connect } from 'react-redux'

// import * as Constants from '../../constants/indexConstants.js'
import { dispatchActionOnly } from '../../actions/indexActions'
import { COMPLETE_ONBOARDING } from '../../constants/indexConstants.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import OnBoardingScene from '../../modules/UI/scenes/OnBoarding/OnBoardingScene.js'

export const mapStateToProps = (state: State) => ({
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  finishOnBoarding: () => dispatch(dispatchActionOnly(COMPLETE_ONBOARDING))
})

export default connect(mapStateToProps, mapDispatchToProps)(OnBoardingScene)
