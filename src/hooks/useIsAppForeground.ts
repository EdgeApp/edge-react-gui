import * as React from 'react'
import { AppState } from 'react-native'

export const useIsAppForeground = (): boolean => {
  const [isForeground, setIsForeground] = React.useState(true)

  React.useEffect(() => {
    const listener = AppState.addEventListener('change', state => setIsForeground(state === 'active'))
    return () => listener.remove()
  })

  return isForeground
}
