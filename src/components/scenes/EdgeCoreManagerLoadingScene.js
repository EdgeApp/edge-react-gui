// @flow

import React from 'react'
import { ActivityIndicator, StyleSheet } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { theme } from '../../theme/variables/edgeDark.js'
import { PLATFORM } from '../../theme/variables/platform.js'

const UPPER_LEFT = { x: 0, y: 0 }
const UPPER_RIGHT = { x: 1, y: 0 }

export const EdgeCoreManagerLoadingScene = () => {
  return (
    <LinearGradient style={styles.container} start={UPPER_LEFT} end={UPPER_RIGHT} colors={[theme.background1, theme.background2]}>
      <ActivityIndicator size="large" />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: PLATFORM.deviceHeight,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
