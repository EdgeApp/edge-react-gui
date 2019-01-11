// @flow

import React from 'react'
import { StyleSheet } from 'react-native'
import Entypo from 'react-native-vector-icons/Entypo'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import IonIcon from 'react-native-vector-icons/Ionicons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'
import SimpleIcon from 'react-native-vector-icons/SimpleLineIcons'

import * as Constants from '../../../../constants/indexConstants'
import THEME from '../../../../theme/variables/airbitz.js'

type Props = {
  style?: StyleSheet.Styles,
  name: string,
  size?: number,
  type: string
}

const Icon = ({ style, name, size, type }: Props) => {
  switch (type) {
    case Constants.ENTYPO:
      return <Entypo style={style} color={THEME.COLORS.SECONDARY} name={name} size={size} />
    case Constants.MATERIAL_ICONS:
      return <MaterialIcon style={style} color={THEME.COLORS.SECONDARY} name={name} size={size} />
    case Constants.FONT_AWESOME:
      return <FAIcon style={style} color={THEME.COLORS.SECONDARY} name={name} size={size} />
    case Constants.ION_ICONS:
      return <IonIcon style={style} color={THEME.COLORS.SECONDARY} name={name} size={size} />
    case Constants.SIMPLE_ICONS:
      return <SimpleIcon style={style} color={THEME.COLORS.SECONDARY} name={name} size={size} />
    case Constants.MATERIAL_COMMUNITY:
      return <MCIcon style={style} color={THEME.COLORS.SECONDARY} name={name} size={size} />
    default:
      return <FAIcon name={'question'} color={THEME.COLORS.SECONDARY} style={style} />
  }
}

export { Icon }
