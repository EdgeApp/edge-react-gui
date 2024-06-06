import '@ethersproject/shims'

import { ErrorBoundary, wrap } from '@sentry/react-native'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { CrashScene } from './scenes/CrashScene'
import { EdgeCoreManager } from './services/EdgeCoreManager'
import { StatusBarManager } from './services/StatusBarManager'
import { ThemeProvider } from './services/ThemeContext'

function MainApp() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
          <ErrorBoundary fallback={<CrashScene />}>
            <StatusBarManager />
            <EdgeCoreManager />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export const App = wrap(MainApp)
