// @flow

import React from 'react'
import { Image, StyleSheet } from 'react-native'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'

type Props = {
  icon?: string,
  iconType?: string,
  iconImage?: string
}

export const iconSize = scale(40)

export function ModalIcon (props: Props) {
  if (props.iconImage) {
    return <Image source={props.iconImage} />
  }
  if (props.icon != null && props.iconType != null) {
    return <Icon style={styles.icon} name={props.icon} size={iconSize} type={props.iconType} />
  }
  return <EntypoIcon name="info" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
}

const styles = StyleSheet.create({
  icon: {
    color: THEME.COLORS.SECONDARY,
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
})
