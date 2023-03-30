import * as React from 'react'

import { useState } from '../../types/reactHooks'
import { Tile } from './Tile'

interface Props {
  contentPadding?: boolean
  maximumHeight?: 'small' | 'medium' | 'large'
  onDone: () => void
  isoExpireDate: string
  title: string
}

export const CountdownTile = (props: Props) => {
  const { contentPadding, isoExpireDate, maximumHeight, onDone, title } = props

  const timeoutHandler = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [tick, setTick] = useState<number>(0)
  const [expireSeconds, setExpireSeconds] = useState<number | undefined>(undefined)

  React.useEffect(() => {
    if (timeoutHandler.current != null) {
      clearTimeout(timeoutHandler.current)
    }
    const nowSeconds = new Date().getTime() / 1000
    const timeoutSeconds = new Date(isoExpireDate).getTime() / 1000
    const expireS = Math.max(Math.round(timeoutSeconds - nowSeconds), 0)
    setExpireSeconds(expireS)
    if (expireS <= 0) {
      onDone()
    }
    timeoutHandler.current = setTimeout(() => setTick(tick + 1), 500)
    return () => clearTimeout(timeoutHandler.current)
  }, [isoExpireDate, onDone, tick])

  if (expireSeconds == null) return null

  const date = new Date(expireSeconds * 1000)
  let time = date.toISOString().slice(11, 19)
  if (time.startsWith('00:')) time = time.slice(3)

  return <Tile type="static" title={title} body={time} maximumHeight={maximumHeight} contentPadding={contentPadding} />
}
