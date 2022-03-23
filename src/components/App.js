// @flow

import * as React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { CrashScene } from './scenes/CrashScene.js'
import { EdgeCoreManager } from './services/EdgeCoreManager.js'
import { ErrorBoundary } from './services/ErrorBoundary.js'
import { StatusBarManager } from './services/StatusBarManager.js'
import { ThemeProvider } from './services/ThemeContext.js'

function logCrash(error: { originalError: mixed }) {
  console.log('Showing crash screen:', error.originalError)
}

export function App(props: {}) {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <ErrorBoundary FallbackComponent={CrashScene} onError={logCrash}>
          <StatusBarManager />
          <EdgeCoreManager />
        </ErrorBoundary>
      </GestureHandlerRootView>
    </ThemeProvider>
  )
}
