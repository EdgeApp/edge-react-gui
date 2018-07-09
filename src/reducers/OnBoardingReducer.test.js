/* eslint-disable flowtype/require-valid-file-annotation */

/* globals test expect */
import { onBoarding as onBoardingReducer } from './OnBoardingReducer.js'

test('initialState', () => {
  const expected = {
    currentIndex: 0,
    totalSlides: 4,
    slides: [
      {
        text: 'title 1',
        iOSImage: 'onboard1',
        iPadImage: 'onboard1',
        iPadImageHoriz: 'onboard1',
        androidImage: 'onboard1'
      },
      {
        text: 'title 2',
        iOSImage: 'onboard2',
        iPadImage: 'onboard2',
        iPadImageHoriz: 'onboard2',
        androidImage: 'onboard2'
      },
      {
        text: 'title 3',
        iOSImage: 'onboard3',
        iPadImage: 'onboard3',
        iPadImageHoriz: 'onboard3',
        androidImage: 'onboard3'
      },
      {
        text: 'title 4',
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
