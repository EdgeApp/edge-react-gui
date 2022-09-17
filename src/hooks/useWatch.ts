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
  const [out, setOut] = React.useState<any>(object[name])

  React.useEffect(() => {
    setOut(object[name])
    return object.watch(name, setOut)
  }, [object, name])

  return out
}
