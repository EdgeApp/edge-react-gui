// @flow

import THEME from '../../theme/variables/airbitz'
import { PagingWithDotStyles } from '../components/PagingWithDotStyles'

const OnBoardingSceneStyles = {
  /* modalContainer: {
    flex: 1,
    alignItems: 'center',
    zIndex: 1,
    elevation: 1
  }, */
  mainContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: 0,
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
  wrapper: {},
  slideContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  slideContainer2: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.ACCENT_MINT
  },
  buttonContainerRow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'column',
    width: '100%',
    height: THEME.BUTTONS.HEIGHT,
    top: '82%'
  },
  buttonContainer: {
    width: '50%',
    height: THEME.BUTTONS.HEIGHT
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16,
    lineHeight: 16
  },
  button: {
    width: '30%'
  },
  textOnlyButton: {
    width: '20%'
  },
  textOnlyContainer: {
    position: 'absolute',
    alignItems: 'flex-end',
    flexDirection: 'column',
    width: '100%',
    height: THEME.BUTTONS.HEIGHT,
    top: '3%'
  }
}

export { OnBoardingSceneStyles }
