// @flow

import * as React from 'react'
import { Pressable, View } from 'react-native'

import DropDown from '../../components/animation/DropDown'
import { useEffect, useState } from '../../types/reactHooks'

type Props = {
  list: React.Node,
  header: React.Node,
  separator?: React.Node,
  isFetching?: boolean,
  onIsOpen?: (value: boolean) => void,
  durantionDown?: number,
  durantionOpacity?: number,
  forceClose?: boolean
}

export default function DropDownList({
  list,
  header,
  separator,
  isFetching = false,
  onIsOpen,
  durantionDown = 300,
  durantionOpacity = 100,
  forceClose = false
}: Props) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (forceClose) {
      toggleState(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceClose])

  const toggleState = (isOpenValue: boolean) => {
    setIsOpen(!isOpenValue)

    if (onIsOpen) onIsOpen(!isOpenValue)
  }

  const onPress = () => {
    if (isFetching) return null

    toggleState(isOpen)
  }

  return (
    <View>
      <Pressable onPress={onPress}>
        <View>{header}</View>
      </Pressable>
      {separator || null}
      <DropDown isOpen={isOpen}>{list}</DropDown>
    </View>
  )
}
