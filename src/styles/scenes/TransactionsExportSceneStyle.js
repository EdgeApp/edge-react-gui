// @flow
import { isIphoneX } from '../../lib/isIphoneX.js'
import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'
import * as Styles from '../indexStyles'

const TransactionExportSceneStyle = {
  container: {
    ...Styles.SceneContainer,
    height: PLATFORM.deviceHeight - THEME.HEADER - THEME.FOOTER_TABS_HEIGHT * 2 - (isIphoneX ? 68 : 0),
    alignItems: 'center'
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%'
  },
  actionButtonContainer: {
    width: '90%',
    height: scale(THEME.BUTTONS.HEIGHT)
  },
  shim: {
    height: scale(20)
  },
  emailModal: Styles.TwoButtonModalStyle,
  inputModal: {
    ...Styles.MaterialInputOnWhite,
    container: { ...Styles.MaterialInputOnWhite.container, width: '100%' }
  },
  modalMiddle: {
    width: '100%'
  },
  staticModalText: {
    color: THEME.COLORS.GRAY_1,
    width: '100%',
    fontSize: 15,
    textAlign: 'center'
  }
}

export { TransactionExportSceneStyle }
