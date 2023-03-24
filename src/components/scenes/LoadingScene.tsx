import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'
import { SceneWrapper } from '../common/SceneWrapper'

export const LoadingScene = () => {
  return (
    <SceneWrapper background="theme" hasHeader={false} hasTabs={false}>
      <View style={styles.container}>
        <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} size="large" />
      </View>
    </SceneWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
})
