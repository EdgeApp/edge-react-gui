// @flow

import { AppState } from 'react-native'

import { useEffect, useState } from '../types/reactHooks.js'

export const useIsAppForeground = (): boolean => {
  const [isForeground, setIsForeground] = useState(true)

  useEffect(() => {
    const listener = AppState.addEventListener('change', state => setIsForeground(state === 'active'))
    return () => listener.remove()
  })

  return isForeground
}
