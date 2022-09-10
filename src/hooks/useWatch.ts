import { Subscriber } from 'yaob'

import { useEffect, useState } from '../types/reactHooks'

/**
 * Subscribes to changes in a yaob (core) object's property.
 */
export function useWatch<T extends {}, Name extends keyof T>(object: T & { watch: Subscriber<T> }, name: Name): T[Name] {
  const [out, setOut] = useState(object[name])

  useEffect(() => {
    setOut(object[name])
    return object.watch(name, setOut)
  }, [object, name])

  return out
}
