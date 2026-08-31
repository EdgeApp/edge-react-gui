import { useLowPowerMode } from 'expo-battery'
import { useMemo } from 'react'

/**
 * Power-state helpers via expo-battery.
 * react-native-device-info stays linked for hasNotch and getUniqueId.
 */

export const usePowerState = (): { lowPowerMode: boolean } => {
  const lowPowerMode = useLowPowerMode()
  return useMemo(() => ({ lowPowerMode }), [lowPowerMode])
}
