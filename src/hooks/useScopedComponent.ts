import * as React from 'react'

/**
 * This returns a component constant which uses an internal reference to a
 * render function to maintain closure over it's parent components scope.
 *
 * This pattern is very useful to safely create child components within a
 * parent component in order to have access to the parent component's scope
 * via the render function.
 */
export const useScopedComponent = <Props extends {} = {}>(Component: React.FunctionComponent<Props>): React.FunctionComponent<Props> => {
  function ScopedComponent(props: Props): React.ReactElement<any, any> | null {
    return ref.current.Component(props)
  }
  const displayName = Component.displayName ?? 'Anonymous'
  ScopedComponent.displayName = `ScopedComponent(${displayName})`

  const ref = React.useRef({
    ScopedComponent,
    Component
  })
  ref.current.Component = Component

  return ref.current.ScopedComponent
}
