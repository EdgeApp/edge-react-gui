import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import MaterialIcon from 'react-native-vector-icons/MaterialIcons'

import { cacheStyles, Theme, ThemeProps, withTheme } from '../../components/services/ThemeContext'
import { EdgeText } from '../../components/themed/EdgeText'

interface Props {
  onPress: () => void
  title: string | React.ReactNode
  iconColor?: string
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
