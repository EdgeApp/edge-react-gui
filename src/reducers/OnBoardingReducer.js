// @flow
import { CHANGE_ONBOARDING_SLIDE } from '../constants/indexConstants.js'
import s from '../locales/strings.js'
import type { Action } from '../modules/ReduxTypes.js'

type OnBoardingType = {
  currentIndex: number,
  totalSlides: number,
  slides: Array<Object>
}
const initialState: OnBoardingType = {
  currentIndex: 0,
  totalSlides: 4,
  slides: [
    {
      text: s.strings.onboarding_slide_1,
      iOSImage: 'onboard1',
      iPadImage: 'iPadOnboarding1Vert',
      iPadImageHoriz: 'iPadOnboarding1Horiz',
      androidImage: 'onboard1'
    },
    {
      text: s.strings.onboarding_slide_2,
      iOSImage: 'onboard2',
      iPadImage: 'iPadOnboarding2Vert',
      iPadImageHoriz: 'iPadOnboarding2Horiz',
      androidImage: 'onboard2'
    },
    {
      text: s.strings.onboarding_slide_3,
      iOSImage: 'onboard3',
      iPadImage: 'iPadOnboarding3Vert',
      iPadImageHoriz: 'iPadOnboarding3Horiz',
      androidImage: 'onboard3'
    },
    {
      text: s.strings.onboarding_slide_4,
      iOSImage: 'onboard4',
      iPadImage: 'iPadOnboarding4Vert',
      iPadImageHoriz: 'iPadOnboarding4Horiz',
      androidImage: 'onboard4'
    }
  ]
}

const onBoarding = (state: OnBoardingType = initialState, action: Action): OnBoardingType => {
  switch (action.type) {
    case CHANGE_ONBOARDING_SLIDE:
      return {...state, currentIndex: action.data}
    default:
      return state
  }
}

export { onBoarding }
