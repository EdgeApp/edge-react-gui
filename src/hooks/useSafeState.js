// @flow
import * as React from 'react'

import { useCallback, useEffect, useRef } from '../types/reactHooks'

export const useSafeState = <T>(initialState: T) => {
  // $FlowFixMe
  const [state, setState] = React.useState(initialState)

  const mounted = useRef(true)

  useEffect(() => {
    return () => {
      mounted.current = false
    }
  }, [])

  const setSafeState = useCallback(data => {
    mounted.current && setState(data)
  }, [])

  return [state, setSafeState]
}
