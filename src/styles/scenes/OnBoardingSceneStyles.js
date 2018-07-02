// @flow

import { PLATFORM } from '../../theme/variables/platform'

import THEME from '../../theme/variables/airbitz'

const OnBoardingSceneStyles = {
  /* modalContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1
  }, */
  modalContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: PLATFORM.deviceHeight * 1 / 8,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.PRIMARY
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.COLORS.ACCENT_MINT
  },
  wrapper: {
  },
  slide1: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9DD6EB'
  },
  slide2: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#97CAE5'
  },
  slide3: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#92BBD9'
  },
  text: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold'
  }
}

export { OnBoardingSceneStyles }
