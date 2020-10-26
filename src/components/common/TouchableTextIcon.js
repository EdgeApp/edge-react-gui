// @flow

import * as React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'

type Props = {
  onPress: Function,
  title: string | React.Node,
  iconColor?: string,
  iconSize?: number
}

export class TouchableTextIcon extends React.Component<Props> {
  render() {
    const { iconColor, iconSize, onPress, title } = this.props
    return (
      <TouchableOpacity onPress={onPress} style={styles.textIconContainer}>
        {typeof title === 'string' ? (
          <T style={styles.iconText} ellipsizeMode="middle" numberOfLines={1}>
            {title}
          </T>
        ) : (
          title
        )}
        <MaterialIcons name="keyboard-arrow-down" color={iconColor || THEME.COLORS.WHITE} size={iconSize || THEME.rem(1.5)} />
      </TouchableOpacity>
    )
  }
}

const styles = StyleSheet.create({
  textIconContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconText: {
    color: THEME.COLORS.WHITE,
    fontSize: THEME.rem(1.25)
  }
})
