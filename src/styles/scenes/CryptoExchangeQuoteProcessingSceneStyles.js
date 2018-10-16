// @flow

import { scale } from '../../lib/scaling'
import THEME from '../../theme/variables/airbitz'
import * as Styles from '../indexStyles'
const CryptoExchangeQuoteProecessingSceneStyles = {
  scene: Styles.SceneContainer,
  gradient: {
    height: THEME.SPACER.HEADER
  },
  top: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  bottom: {
    flex: 1
  },
  momentText: {
    color: THEME.COLORS.WHITE,
    width: '100%',
    textAlign: 'center',
    fontSize: scale(18),
    marginBottom: scale(20)
  },
  findingText: {
    color: THEME.COLORS.WHITE,
    width: '100%',
    textAlign: 'center',
    fontSize: scale(14)
  }
}

export { CryptoExchangeQuoteProecessingSceneStyles }
