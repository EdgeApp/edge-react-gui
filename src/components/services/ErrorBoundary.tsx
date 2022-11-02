import Bugsnag from '@bugsnag/react-native'
import * as React from 'react'

interface Props {
  children: React.ReactNode
  FallbackComponent: React.ComponentType<{}>
  onError?: (error: { originalError: unknown }) => void
}
interface State {
  hasError: boolean
}

/**
 * Shows the crash scene if any component throws an exception
 * in a React lifecyle method.
 */
class ErrorBoundaryComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    if (this.props.onError != null) {
      this.props.onError({ originalError: error })
    }
  }

  render() {
    const { children, FallbackComponent } = this.props
    if (this.state.hasError) return <FallbackComponent />

    return children
  }
}

const reactPlugin = Bugsnag.getPlugin('react')
export const ErrorBoundary: typeof ErrorBoundaryComponent = reactPlugin != null ? reactPlugin.createErrorBoundary(React) : ErrorBoundaryComponent
