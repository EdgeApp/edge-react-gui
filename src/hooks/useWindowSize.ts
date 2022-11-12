import * as React from 'react'
import { Dimensions } from 'react-native'

interface ScaledSize {
  width: number
  height: number
}

/**
 * Subscribes to the window dimensions, for use in style calculations.
 */
export function useWindowSize(): ScaledSize {
  const [windowSize, setWindowSize] = React.useState<ScaledSize>(() => Dimensions.get('window'))

  React.useEffect(() => {
    // @ts-expect-error
    const handleChange = ({ window }) => setWindowSize(window)
    const listener = Dimensions.addEventListener('change', handleChange)
    return () => listener.remove()
  }, [])

  return windowSize
}
