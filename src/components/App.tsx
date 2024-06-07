import '@ethersproject/shims'

import { ErrorBoundary, Scope, wrap } from '@sentry/react-native'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { useHandler } from '../hooks/useHandler'
import { CrashScene } from './scenes/CrashScene'
import { EdgeCoreManager } from './services/EdgeCoreManager'
import { StatusBarManager } from './services/StatusBarManager'
import { ThemeProvider } from './services/ThemeContext'

function MainApp() {
  const handleBeforeCapture = useHandler((scope: Scope) => {
    scope.setTag('handled', false)
  })

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <GestureHandlerRootView style={StyleSheet.absoluteFill}>
          <ErrorBoundary beforeCapture={handleBeforeCapture} fallback={<CrashScene />}>
            <StatusBarManager />
            <EdgeCoreManager />
          </ErrorBoundary>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export const App = wrap(MainApp)
