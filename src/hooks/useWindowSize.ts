import { Dimensions } from 'react-native'

import { useEffect, useState } from '../types/reactHooks'

type ScaledSize = {
  width: number
  height: number
}

/**
 * Subscribes to the window dimensions, for use in style calculations.
 */
export function useWindowSize(): ScaledSize {
  const [windowSize, setWindowSize] = useState<ScaledSize>(() => Dimensions.get('window'))

  useEffect(() => {
    // @ts-expect-error
    const handleChange = ({ window }) => setWindowSize(window)
    const listener = Dimensions.addEventListener('change', handleChange)
    return () => listener.remove()
  }, [])

  return windowSize
}
