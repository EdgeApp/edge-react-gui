import '@ethersproject/shims'

import { ErrorBoundary, type Scope, wrap } from '@sentry/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { useHandler } from '../hooks/useHandler'
import { CrashScene } from './scenes/CrashScene'
import { EdgeCoreManager } from './services/EdgeCoreManager'
import { StatusBarManager } from './services/StatusBarManager'
import { ThemeProvider } from './services/ThemeContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false
    }
  }
})

function MainApp() {
  const handleBeforeCapture = useHandler((scope: Scope) => {
    scope.setLevel('fatal')
    scope.setTag('handled', false)
  })

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <GestureHandlerRootView style={StyleSheet.absoluteFill}>
            <ErrorBoundary
              beforeCapture={handleBeforeCapture}
              fallback={<CrashScene />}
            >
              <StatusBarManager />
              <EdgeCoreManager />
            </ErrorBoundary>
          </GestureHandlerRootView>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

export const App = wrap(MainApp)
