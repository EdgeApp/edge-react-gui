// @flow

import { type LayoutChangeEvent, type LayoutRectangle } from 'react-native'

import { useState } from '../types/reactHooks.js'

export const useLayout = (): [LayoutRectangle, (e: LayoutChangeEvent) => void] => {
  const [layout, setLayout] = useState({
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
