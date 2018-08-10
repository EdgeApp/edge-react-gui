// @flow

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'
import {PagingWithDotStyles} from '../components/PagingWithDotStyles'

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
    width: '100%',
    height: '100%',
    backgroundColor: THEME.COLORS.PRIMARY
  },
  dots: {
    ...PagingWithDotStyles,
    container: {
      ...PagingWithDotStyles.container,
      position: 'absolute',
      top: '77%',
      left: 0,
      right: 0,
      height: 20
    }
  },
  wrapper: {
  },
  slideContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  buttonContainer: {
    position: 'absolute',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    height: THEME.BUTTONS.HEIGHT,
    top: '84%'
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },
  shim: {
    width: '5%'
  },
  button: {
    width: '40%'
  }
}

export { OnBoardingSceneStyles }
