import { useRef } from 'react'

import { useHandler } from '../../../hooks/useHandler'
import { useState } from '../../../types/reactHooks'

export class StateManager<State extends object> {
  private _state: State
  private readonly onUpdate: (state: State) => void

  constructor(state: State, onUpdate: (state: State) => void) {
    this._state = state
    this.onUpdate = onUpdate
  }

  get state(): State {
    return this._state
  }

  update(state: Partial<State>): void {
    this._state = { ...this._state, ...state }
    this.onUpdate(this._state)
  }
}

export const useStateManager = <T extends object>(defaultState: T): StateManager<T> => {
  const [state, setState] = useState<T>(defaultState)
  const handleUpdate: StateManager<T>['update'] = useHandler((state: Partial<T>) => setState({ ...stateManagerRef.current.state, ...state }))
  const stateManagerRef = useRef<StateManager<T>>(new StateManager(state, handleUpdate))

  return stateManagerRef.current
}
