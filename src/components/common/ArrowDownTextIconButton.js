// @flow

import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../components/services/ThemeContext.js'
import { EdgeText } from '../../components/themed/EdgeText.js'

type Props = {
  onPress: Function,
  title: string | React.Node,
  iconColor?: string,
  iconSize?: number
}

class ArrowDownTextIconButtonComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    const { iconColor, iconSize, onPress, theme, title } = this.props
    const styles = getStyles(theme)
    return (
      <TouchableOpacity onPress={onPress} style={styles.container}>
        {typeof title === 'string' ? <EdgeText>{title}</EdgeText> : title}
        <MaterialIcon name="keyboard-arrow-down" color={iconColor || theme.icon} size={iconSize || theme.rem(1.5)} />
      </TouchableOpacity>
    )
  }
}

export const ArrowDownTextIconButton = withTheme(ArrowDownTextIconButtonComponent)

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  }
}))
