// @flow

import * as React from 'react'
import { Button } from 'react-native'

import { CrashScene } from './scenes/CrashScene.js'
import { EdgeCoreManager } from './services/EdgeCoreManager.js'
import { ErrorBoundary } from './services/ErrorBoundary.js'
import { ThemeProvider } from './services/ThemeContext.js'

export function App(props: {}) {
  return (
    <ThemeProvider>
      <ErrorBoundary FallbackComponent={CrashScene}>
        <>
          <EdgeCoreManager />
          <ThrowError />
        </>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

class ThrowError extends React.Component<{}, { throwError: boolean }> {
  state = { throwError: false }

  render() {
    if (this.state.throwError) {
      throw new Error('BOOM')
    }

    return <Button title="BOOM" onPress={() => this.setState(state => ({ ...state, throwError: true }))} />
  }
}
