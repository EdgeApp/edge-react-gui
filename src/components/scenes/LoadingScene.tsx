import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { SceneWrapper } from '../common/SceneWrapper'
import { useTheme } from '../services/ThemeContext'

export const LoadingScene = () => {
  const theme = useTheme()
  return (
    <SceneWrapper background="theme" hasHeader={false} hasTabs={false}>
      <View style={styles.container}>
        <ActivityIndicator color={theme.loadingIcon} size="large" />
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
