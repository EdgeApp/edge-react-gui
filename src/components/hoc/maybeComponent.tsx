import React from 'react'

/**
 * Either render the given component or a React.Fragment component depending on
 * a `when` prop.
 *
 * @param Component the component to render if `when={true}`
 * @returns
 */
export function maybeComponent<Props>(Component: React.ComponentType<Props>): React.ComponentType<Props & { children?: React.ReactNode; when: boolean }> {
  function MaybeComponent(props: Props & { children?: React.ReactNode; when: boolean }) {
    const { when, ...rest } = props
    const typeHack: JSX.IntrinsicAttributes & Props = rest as any
    return when ? <Component {...typeHack} /> : <>{props.children}</>
  }
  return MaybeComponent
}
