import * as React from 'react'

import { showError } from '../components/services/AirshipInstance'

export function useRefresher<T>(
  cb: () => Promise<T>,
  defaultValue: T,
  delay: number,
  /** Stops refreshing once this returns true for a value. */
  isFinal?: (value: T) => boolean
): T {
  const [value, setValue] = React.useState<T>(defaultValue)

  React.useEffect(() => {
    let abort = false
    let timerId: ReturnType<typeof setTimeout> | undefined
    const handleTimeout = (): void => {
      cb()
        .then(value => {
          if (abort) return
          setValue(value)
          if (isFinal?.(value) === true) return
          timerId = setTimeout(handleTimeout, delay)
        })
        .catch((err: unknown) => {
          showError(err)
        })
    }
    // Without a default value to show, the first refresh runs right away:
    if (defaultValue == null) handleTimeout()
    else timerId = setTimeout(handleTimeout, delay)

    return () => {
      abort = true
      clearTimeout(timerId)
    }
  }, [cb, delay, defaultValue, isFinal])

  return value
}
