import React, { useEffect, useRef } from 'react'
import { View } from 'react-native'

interface Props {
  expiration: Date
  timeExpired: () => void
}

export const TEN_MINUTES = 600

export const CircleTimer: React.FC<Props> = ({ expiration, timeExpired }) => {
  const componentMounted = useRef(true)
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  const timerTick = () => {
    if (!componentMounted.current) {
      if (timeoutId.current != null) {
        clearTimeout(timeoutId.current)
      }
      return
    }
    const now = new Date()
    const nowMilli = now.getTime()
    const expMil = expiration.getTime()
    if (expiration && nowMilli >= expMil) {
      timeExpired()
      return
    }
    /* To be used when we have an actual UI
    const delta = TEN_MINUTES - (expiration - nowMilli) / 1000;
    const percentage = (delta / TEN_MINUTES) * 100;
    console.log('timer: delta', delta);
    console.log('timer: percentage ', percentage); */
    timeoutId.current = setTimeout(timerTick, 1000)
  }

  useEffect(() => {
    componentMounted.current = true
    timeoutId.current = setTimeout(timerTick, 1000)

    return () => {
      componentMounted.current = false
      if (timeoutId.current != null) {
        clearTimeout(timeoutId.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (expiration !== null) {
      if (timeoutId.current != null) {
        clearTimeout(timeoutId.current)
      }
      timeoutId.current = setTimeout(timerTick, 1000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiration])

  if (!expiration) {
    return null
  }

  return <View style={{ width: 1, height: 1 }} />
}
