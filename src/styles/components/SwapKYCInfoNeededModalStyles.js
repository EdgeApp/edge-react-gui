// @flow

import THEME from '../../theme/variables/airbitz'
import * as Styles from '../indexStyles'

const SwapKYCInfoNeededStyles = {
  scene: Styles.SceneContainer,
  gradient: {
    height: THEME.SPACER.HEADER,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10
  },
  topRow: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  logoImage: {
    position: 'relative',
    width: '80%',
    height: '100%',
    resizeMode: 'contain'
  },
  actionButtonContainer: {
    width: '90%'
  },
  centerRow: {
    flex: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: '5%'
  },
  bottomRow: {
    flex: 3,
    padding: '5%',
    alignItems: 'center'
  },
  bodyText: {
    color: THEME.COLORS.WHITE
  },
  topLevel: {
    zIndex: 10,
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE,
    alignSelf: 'stretch',
    position: 'absolute',
    height: '100%'
  },
  content: {
    flex: 1,
    width: '100%'
  }
}

export { SwapKYCInfoNeededStyles }
