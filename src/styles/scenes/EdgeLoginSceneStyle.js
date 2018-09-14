// @flow

import { isIphoneX } from '../../lib/isIphoneX.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'
import * as Styles from '../indexStyles'

const EdgeLoginScreen = {
  container: {
    ...Styles.SceneContainer,
    height: PLATFORM.deviceHeight - THEME.HEADER - THEME.FOOTER_TABS_HEIGHT * 2 - (isIphoneX ? 68 : 0)
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%'
  },
  header: {
    position: 'relative',
    flex: 3,
    flexDirection: 'column'
  },
  headerTopShim: {
    flex: 2
  },
  headerImageContainer: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  image: {
    width: 80,
    height: 80
  },
  headerTextRow: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  headerText: {
    color: THEME.COLORS.PRIMARY,
    fontSize: 36
  },
  headerBottomShim: {
    flex: 1
  },
  body: {
    position: 'relative',
    flex: 4
  },
  buttonContainer: {
    position: 'relative',
    flex: 3,
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'flex-end'
  },
  buttons: {
    marginRight: '5%',
    marginLeft: '5%',
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  buttonsProcessing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  spinnerContainer: {
    flex: 1
  },
  bodyText: {
    marginRight: '5%',
    marginLeft: '5%',
    color: THEME.COLORS.GRAY_1,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT
  },
  bodyTextWarning: {
    marginRight: '5%',
    marginLeft: '5%',
    color: THEME.COLORS.ACCENT_RED,
    fontSize: 18,
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT
  },
  cancel: {
    flex: 1,
    marginRight: '1.5%',
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  cancelSolo: {
    flex: 1,
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  submit: {
    flex: 1,
    marginLeft: '1.5%',
    backgroundColor: THEME.COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
}

export { EdgeLoginScreen }
