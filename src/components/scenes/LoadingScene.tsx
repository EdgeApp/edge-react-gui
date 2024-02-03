import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { SceneWrapper } from '../common/SceneWrapper'
import { useTheme } from '../services/ThemeContext'

/**
 * This is a scene component, so therefore it must be used in react-navigation
 * component hierarchy. Use LoadingSplashScreen for rendering a loading state
 * above outside of the navigation/provider component tree.
 */
export const LoadingScene = () => {
  const theme = useTheme()
  return (
    <SceneWrapper hasHeader={false}>
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
