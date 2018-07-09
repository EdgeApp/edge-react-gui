/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */
import { onBoarding as onBoardingReducer } from './OnBoardingReducer.js'
import s from '../locales/strings.js'

test('initialState', () => {
  const expected = {
    currentIndex: 0,
    totalSlides: 4,
    slides: [
      {
        text: s.strings.onboarding_slide_1,
        iOSImage: 'onboard1',
        iPadImage: 'onboard1',
        iPadImageHoriz: 'onboard1',
        androidImage: 'onboard1'
      },
      {
        text: s.strings.onboarding_slide_2,
        iOSImage: 'onboard2',
        iPadImage: 'onboard2',
        iPadImageHoriz: 'onboard2',
        androidImage: 'onboard2'
      },
      {
        text: s.strings.onboarding_slide_3,
        iOSImage: 'onboard3',
        iPadImage: 'onboard3',
        iPadImageHoriz: 'onboard3',
        androidImage: 'onboard3'
      },
      {
        text: s.strings.onboarding_slide_4,
        iOSImage: 'onboard4',
        iPadImage: 'onboard4',
        iPadImageHoriz: 'onboard4',
        androidImage: 'onboard4'
      }
    ]
  }
  const actual = onBoardingReducer(undefined, {})

  expect(actual).toEqual(expected)
})
