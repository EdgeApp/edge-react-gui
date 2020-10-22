// @flow

import * as React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'

type Props = {
  icon?: React.Node,
  onPress: Function,
  title: string | React.Node
}

export class TouchableTextIcon extends React.Component<Props> {
  render() {
    const { icon, onPress, title } = this.props
    return (
      <TouchableOpacity onPress={onPress} style={styles.textIconContainer}>
        {typeof title === 'string' ? (
          <T style={styles.iconText} ellipsizeMode="middle" numberOfLines={1}>
            {title}
          </T>
        ) : (
          title
        )}
        {icon || <MaterialIcons name="keyboard-arrow-down" color={THEME.COLORS.WHITE} size={scale(25)} />}
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
    fontSize: scale(20)
  }
})
