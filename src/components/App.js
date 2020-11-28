// @flow

import * as React from 'react'

import { CrashScene } from './scenes/CrashScene.js'
import { EdgeCoreManager } from './services/EdgeCoreManager.js'
import { ErrorBoundary } from './services/ErrorBoundary.js'
import { ThemeProvider } from './services/ThemeContext.js'

export function App(props: {}) {
  return (
    <ThemeProvider>
      <ErrorBoundary FallbackComponent={CrashScene}>
        <EdgeCoreManager />
      </ErrorBoundary>
    </ThemeProvider>
  )
}
