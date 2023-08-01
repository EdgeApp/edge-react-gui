import * as React from 'react'
import { ImageStyle, StyleProp, TextStyle, ViewStyle } from 'react-native'

import { Theme, useTheme } from '../services/ThemeContext'

interface StyleProps {
  style?: StyleProp<any>
}
type ValidStyles = ImageStyle | TextStyle | ViewStyle | ValidStyles[]

export function styled<BaseProps extends StyleProps>(Component: React.ComponentType<BaseProps>) {
  function makeStyledComponent<Props extends object>(
    styler: ValidStyles | ((theme: Theme) => ValidStyles | ((props: Omit<BaseProps, 'style'> & Props) => ValidStyles))
  ) {
    const StyledComponent: React.ComponentType<Omit<BaseProps, 'style'> & Props> = props => {
      const theme = useTheme()
      const rt = typeof styler === 'function' ? styler(theme) : styler
      const styles = typeof rt === 'function' ? rt(props) : rt
      const allProps: BaseProps = { ...props, style: styles } as any
      return <Component {...allProps} />
    }
    StyledComponent.displayName = Component.displayName != null ? `StyledComponent(${Component.displayName})` : `StyledComponent`
    return StyledComponent
  }
  return makeStyledComponent
}
