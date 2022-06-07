// @flow

import { useRef } from '../types/reactHooks.js'

type State<T> = {
  callback: T,
  bouncer: T
}

/**
 * A better version of `useCallback`.
 *
 * React itself may add this hook in a future version, called `useEvent`.
 * In the meantime, react-native-reanimated has a hook called `useEvent`,
 * so we don't want to conflict with that.
 */
export function useHandler<T: Function>(callback: T): T {
  const bouncer: any = (...args) => stateRef.current.callback(...args)
  const stateRef = useRef<State<T>>({ callback, bouncer })
  stateRef.current.callback = callback

  return stateRef.current.bouncer
}
