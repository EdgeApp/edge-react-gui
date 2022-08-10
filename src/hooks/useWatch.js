// @flow

import { type Subscriber } from 'yaob'

import { useEffect, useState } from '../types/reactHooks.js'

/**
 * Subscribes to changes in a yaob (core) object's property.
 */
export const useWatch = <T: Object, Name: $Keys<T>>(object: { +watch: Subscriber<T> }, name: Name): $ElementType<T, Name> => {
  const [out, setOut] = useState(object[name])

  useEffect(() => {
    setOut(object[name])
    return object.watch(name, setOut)
  }, [object, name])

  return out
}
