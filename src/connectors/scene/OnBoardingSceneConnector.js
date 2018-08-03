// @flow

import { connect } from 'react-redux'

// import * as Constants from '../../constants/indexConstants.js'
import * as actions from '../../actions/indexActions'
import { COMPLETE_ONBOARDING, CHANGE_ONBOARDING_SLIDE } from '../../constants/indexConstants.js'
import type { Dispatch, State } from '../../modules/ReduxTypes'
import OnBoardingScene from '../../modules/UI/scenes/OnBoarding/OnBoardingScene.js'

export const mapStateToProps = (state: State) => ({
  slides: state.onBoarding.slides,
  totalSlides: state.onBoarding.totalSlides
})

export const mapDispatchToProps = (dispatch: Dispatch) => ({
  updateSlideIndex: (index: number) => dispatch(actions.dispatchActionNumber(CHANGE_ONBOARDING_SLIDE, index)),
  finishOnBoarding: () => dispatch(actions.dispatchActionOnly(COMPLETE_ONBOARDING))
})

export default connect(mapStateToProps, mapDispatchToProps)(OnBoardingScene)
