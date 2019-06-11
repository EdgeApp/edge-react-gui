// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz.js'

export const stylesRaw = {
  scene: {
    flex: 1
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%'
  },
  scrollView: {
    height: scale(716 - 10 - THEME.HEADER)
  },
  webView: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  scrollViewContent: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(5),
    paddingBottom: scale(30)
  }
}

export const styles = StyleSheet.create(stylesRaw)
