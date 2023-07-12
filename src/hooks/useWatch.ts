import * as React from 'react'

/**
 * Subscribes to changes in a core object's property.
 */
export function useWatch<
  T extends {
    readonly watch: <Name extends keyof T>(name: Name, callback: (value: T[Name]) => void) => () => void
  },
  Name extends keyof T
>(object: T, name: Name): T[Name] {
  // We need to re-render the component when the value changes.
  // Since [] !== [], we can use an empty array to force an update:
  const [, rerender] = React.useState([])

  React.useEffect(() => {
    return object.watch(name, () => rerender([]))
  }, [object, name])

  return object[name]
}
