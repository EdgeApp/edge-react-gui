import * as React from 'react'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'

export const useLayout = (): [LayoutRectangle, (e: LayoutChangeEvent) => void] => {
  const [layout, setLayout] = React.useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
  const handleLayout = (event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout)
  }
  return [layout, handleLayout]
}
