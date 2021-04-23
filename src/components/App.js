// @flow
// console.disableYellowBox = true

import * as React from 'react'

import { CrashScene } from './scenes/CrashScene.js'
import { EdgeCoreManager } from './services/EdgeCoreManager.js'
import { ErrorBoundary } from './services/ErrorBoundary.js'
import { ThemeProvider } from './services/ThemeContext.js'

function logCrash(error: { originalError: mixed }) {
  console.log('Showing crash screen:', error.originalError)
}

export function App(props: {}) {
  return (
    <ThemeProvider>
      <ErrorBoundary FallbackComponent={CrashScene} onError={logCrash}>
        <EdgeCoreManager />
      </ErrorBoundary>
    </ThemeProvider>
  )
}
