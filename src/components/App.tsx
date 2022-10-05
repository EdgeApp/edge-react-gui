import '@ethersproject/shims'

import * as React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { CrashScene } from './scenes/CrashScene'
import { EdgeCoreManager } from './services/EdgeCoreManager'
import { ErrorBoundary } from './services/ErrorBoundary'
import { StatusBarManager } from './services/StatusBarManager'
import { ThemeProvider } from './services/ThemeContext'

function logCrash(error: { originalError: unknown }) {
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
