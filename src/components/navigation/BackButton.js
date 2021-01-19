// @flow

import * as React from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../components/services/ThemeContext.js'
import { EdgeText } from '../../components/themed/EdgeText.js'

const isIos = Platform.OS === 'ios'

export type Props = {
  withArrow: boolean,
  onPress: () => mixed,
  label?: string
}

class BackButtonComponent extends React.PureComponent<Props & ThemeProps> {
  static defaultProps = {
    withArrow: false,
    onPress: () => {}
  }

  renderIcon = () => {
    const { theme } = this.props
    const styles = getStyles(theme)
    return isIos ? (
      <IonIcon size={theme.rem(1.25)} color={this.props.theme.icon} name="ios-arrow-back" style={styles.backIconStyle} />
    ) : (
      <IonIcon size={theme.rem(1.25)} color={this.props.theme.icon} name="md-arrow-back" style={styles.backIconAndroid} />
    )
  }

  render() {
    const { label, theme, withArrow } = this.props
    const styles = getStyles(theme)
    return (
      <TouchableOpacity style={styles.container} onPress={this.props.onPress}>
        {withArrow && this.renderIcon()}
        {withArrow && !isIos ? null : <EdgeText>{label || ''}</EdgeText>}
      </TouchableOpacity>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  backIconStyle: {
    paddingLeft: theme.rem(0.5),
    paddingRight: theme.rem(0.25)
  },
  backIconAndroid: {
    padding: theme.rem(1)
  }
}))

export const BackButton = withTheme(BackButtonComponent)
