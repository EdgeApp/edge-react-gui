// @flow

import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { nightText } from '../../styles/common/textStyles.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { AirshipDropdown } from '../common/AirshipDropdown.js'

type Props = {
  bridge: AirshipBridge<void>,
  backgroundColor: string,
  imageNode: React.Node,
  message: string,
  onPress: Function
}

export function IconDropdown(props: Props) {
  const { bridge, backgroundColor, message, imageNode, onPress } = props

  return (
    <AirshipDropdown bridge={bridge} backgroundColor={backgroundColor} onPress={onPress}>
      {imageNode}
      <Text style={styles.text}>{message}</Text>
    </AirshipDropdown>
  )
}

const padding = THEME.rem(1 / 4)

const styles = StyleSheet.create({
  text: {
    ...nightText('row-center'),
    padding
  }
})
