// @flow

import React from 'react'
import { TouchableOpacity } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  onPress: () => mixed
}

/**
 * Place this inside a modal (after the content box) to get a close button.
 */
export function ModalCloseArrow (props: Props) {
  return (
    <TouchableOpacity style={{ alignItems: 'center' }} onPress={props.onPress}>
      <EntypoIcon name="chevron-thin-down" size={THEME.rem(1.4)} color={THEME.COLORS.GRAY_1} />
    </TouchableOpacity>
  )
}
