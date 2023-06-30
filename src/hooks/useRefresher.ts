import * as React from 'react'

import { showError } from '../components/services/AirshipInstance'

export function useRefresher<T>(cb: () => Promise<T>, defaultValue: T, delay: number): T {
  const [value, setValue] = React.useState<T>(defaultValue)

  React.useEffect(() => {
    let abort = false
    const handleTimeout = () => {
      cb()
        .then(value => {
          if (abort) return
          setValue(value)
          timerId = setTimeout(handleTimeout, delay)
        })
        .catch(err => showError(err))
    }
    let timerId = setTimeout(handleTimeout, delay)

    if (defaultValue == null) handleTimeout()

    return () => {
      abort = true
      clearTimeout(timerId)
    }
  }, [cb, delay, defaultValue])

  return value
}
