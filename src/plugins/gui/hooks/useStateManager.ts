import { useRef } from 'react'

import { useHandler } from '../../../hooks/useHandler'
import { useState } from '../../../types/reactHooks'

export interface StateManager<State extends object> {
  state: State
  update: (state: Partial<State>) => void
}

export const useStateManager = <T extends object>(defaultState: T): StateManager<T> => {
  const [state, setState] = useState<T>(defaultState)
  const handleUpdate: StateManager<T>['update'] = useHandler((state: Partial<T>) => setState({ ...stateManagerRef.current.state, ...state }))
  const stateManagerRef = useRef<StateManager<T>>({
    state,
    update: handleUpdate
  })
  // Always update the current ref's state
  stateManagerRef.current.state = state

  return stateManagerRef.current
}
