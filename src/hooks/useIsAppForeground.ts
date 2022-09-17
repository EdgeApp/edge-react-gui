import * as React from 'react'
import { AppState } from 'react-native'

import { useState } from '../types/reactHooks'

export const useIsAppForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(true)

  React.useEffect(() => {
    const listener = AppState.addEventListener('change', state => setIsForeground(state === 'active'))
    return () => listener.remove()
  })

  return isForeground
}
