import * as React from 'react'
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle
} from 'react-native'

import {
  cacheStyles,
  getTheme,
  Theme,
  useTheme
} from '../services/ThemeContext'

interface StyleProps {
  style?: StyleProp<any>
}

type ValidStyles = ImageStyle | TextStyle | ViewStyle

type Styler<Props> =
  | ValidStyles
  | ((
      theme: Theme
    ) => ValidStyles | ((props: Props) => ValidStyles | ValidStyles[]))

/**
 * Creates a styled component using a `styler` parameter. The `styler` can be the
 * styles itself, a function with the current theme and component props as
 * curried arguments (e.g. `theme => props => styles` or `theme => styles`).
 * The styles are cached when no `props` parameter is required by the `styler`.
 *
 * **Example Usage**
 *
 * ```
 * const Colorful = styled(Text)({ fontWeight: 'Red' })
 * const Themed = styled(Text)(theme => ({ color: theme.color }))
 * const Dynamic = styled(Text)(theme => props => ({ color: props.color ?? theme.color }))
 * const DynamicSansTheme = styled(Text)(_theme => props => ({ color: props.color }))
 * ```
 */
export function styled<BaseProps extends StyleProps>(
  Component: React.ComponentType<BaseProps>
) {
  function makeStyledComponent<Props extends object>(
    styler: Styler<Props>
  ): React.ComponentType<Omit<BaseProps, 'style'> & Props> {
    function addName<P extends Omit<BaseProps, 'style'> & Props>(
      StyledComponent: React.ComponentType<P>
    ) {
      StyledComponent.displayName =
        Component.displayName != null
          ? `StyledComponent(${Component.displayName})`
          : `StyledComponent`

      return StyledComponent
    }

    if (typeof styler === 'function') {
      const rv = styler(getTheme())
      if (typeof rv === 'function') {
        const stylerNarrowed = styler as (
          theme: Theme
        ) => (props: Props) => ValidStyles | ValidStyles[]
        return addName(function StyledComponent(props) {
          const theme = useTheme()
          const style = stylerNarrowed(theme)(props)

          const allProps: Omit<BaseProps, 'style'> & BaseProps['style'] = {
            ...props,
            style: style
          }
          return <Component {...allProps} />
        })
      } else {
        const stylerNarrowed = styler as (theme: Theme) => ValidStyles
        const getStyles = cacheStyles((theme: Theme) => ({
          style: stylerNarrowed(theme)
        }))

        return addName(function StyledComponent(props) {
          const theme = useTheme()
          const stylesheet = getStyles(theme)

          const allProps: Omit<BaseProps, 'style'> & BaseProps['style'] = {
            ...props,
            style: stylesheet.style
          }
          return <Component {...allProps} />
        })
      }
    } else {
      const stylesheet = StyleSheet.create({ style: styler })

      return addName(function StyledComponent(props) {
        const allProps: Omit<BaseProps, 'style'> & BaseProps['style'] = {
          ...props,
          style: stylesheet.style
        }
        return <Component {...allProps} />
      })
    }
  }
  return makeStyledComponent
}

export function styledWithRef<Ref, BaseProps extends StyleProps>(
  Component: React.ComponentType<BaseProps>
) {
  type RefAttribute = React.RefAttributes<Ref>
  type PropsWithoutStyle = Omit<BaseProps, 'style'>

  function makeStyledComponent<Props extends object>(
    styler: Styler<Props>
  ): React.ForwardRefExoticComponent<
    React.PropsWithoutRef<PropsWithoutStyle & Props> & RefAttribute
  > {
    function addName<P extends PropsWithoutStyle & Props & RefAttribute>(
      StyledComponentWithRef: React.ForwardRefExoticComponent<
        React.PropsWithoutRef<P>
      >
    ): React.ForwardRefExoticComponent<React.PropsWithoutRef<P>> {
      StyledComponentWithRef.displayName =
        Component.displayName != null
          ? `StyledComponentWithRef(${Component.displayName})`
          : `StyledComponentWithRef`
      return StyledComponentWithRef
    }

    if (typeof styler === 'function') {
      const rv = styler(getTheme())
      if (typeof rv === 'function') {
        const stylerNarrowed = styler as (
          theme: Theme
        ) => (props: Props) => ValidStyles | ValidStyles[]
        return addName(
          React.forwardRef<any, PropsWithoutStyle & Props>(
            function StyledComponent(props, ref) {
              const theme = useTheme()
              const style = stylerNarrowed(theme)(props)

              const allProps: PropsWithoutStyle & BaseProps['style'] = {
                ...props,
                style
              }
              return <Component {...allProps} ref={ref} />
            }
          )
        )
      } else {
        const stylerNarrowed = styler as (theme: Theme) => ValidStyles
        const getStyles = cacheStyles((theme: Theme) => ({
          style: stylerNarrowed(theme)
        }))

        return addName(
          React.forwardRef<any, PropsWithoutStyle & Props>(
            function StyledComponent(props, ref) {
              const theme = useTheme()
              const stylesheet = getStyles(theme)

              const allProps: PropsWithoutStyle & BaseProps['style'] = {
                ...props,
                style: stylesheet.style
              }
              return <Component {...allProps} ref={ref} />
            }
          )
        )
      }
    } else {
      const stylesheet = StyleSheet.create({ style: styler })

      return addName(
        React.forwardRef<any, PropsWithoutStyle & Props>(
          function StyledComponent(props, ref) {
            const allProps: PropsWithoutStyle & BaseProps['style'] = {
              ...props,
              style: stylesheet.style
            }

            return <Component {...allProps} ref={ref} />
          }
        )
      )
    }
  }
  return makeStyledComponent
}
