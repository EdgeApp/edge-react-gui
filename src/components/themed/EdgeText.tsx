import * as React from 'react'
import {
  PixelRatio,
  Platform,
  type StyleProp,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle
} from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

export const androidAdjustTextStyle = (theme: Theme): TextStyle | null => {
  const styles = getStyles(theme)
  return Platform.OS === 'android' ? styles.androidAdjust : null
}

// #region Spacing & Alignment =================================================

/**
 * A properly spaced block of text with default font color and size. Children
 * that are wrapped in other `___Text` component types will override those defaults.
 *
 * A `Paragraph` *can* have `marginRem`, but *only* to avoid an extra `View` for
 * spacing out `Paragraph(s)` in relation to their parent, *NOT* to give special
 * spacing *between* `Paragraphs`
 *
 * TODO: Move this to it's own file in `text/` directory or a `typography` directory.
 */
interface ParagraphProps extends TextProps {
  children: React.ReactNode

  center?: boolean

  /** @deprecated A `Paragraph` *can* have `marginRem`, but *only* to avoid an extra `View` for spacing out `Paragraph(s)` in relation to their parent, *NOT* to give special spacing *between* `Paragraphs`. It's still preferable to have the parents deal with spacing outside of `Paragraphs`. */
  marginRem?: number[] | number
}
export const Paragraph: React.FC<ParagraphProps> = (props: ParagraphProps) => {
  const { center = false, children, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))

  return (
    <Text
      allowFontScaling={false}
      style={[
        styles.common,
        margin,
        center && styles.alignCenter,
        androidAdjustTextStyle(theme)
      ]}
      numberOfLines={0}
      adjustsFontSizeToFit={false}
    >
      {children}
    </Text>
  )
}

// #endregion Spacing & Alignment

// #region Typography ==========================================================

/**
 * The new architecture ignores `minimumFontScale` when it shrinks text to fit:
 * both platforms floor at an absolute `minimumFontSize` (4pt when unset) and
 * render long labels illegibly small. React Native's Text never forwards that
 * prop, so `patches/react-native+0.86.0.patch` adds it to the RCTText view
 * config and this derives it from the style's font size, in points on iOS and
 * in pixels on Android (its shrink loop compares against a pixel text size).
 */
export function minimumFontSizeProps(
  style: StyleProp<TextStyle>,
  minimumFontScale: number,
  fallbackFontSize: number
): TextProps {
  const fontSize = StyleSheet.flatten(style)?.fontSize ?? fallbackFontSize
  const floor = fontSize * minimumFontScale
  const props: { minimumFontSize: number } = {
    minimumFontSize:
      Platform.OS === 'android'
        ? PixelRatio.getPixelSizeForLayoutSize(floor)
        : floor
  }
  return props as TextProps
}

interface LabelProps extends TextProps {
  children: React.ReactNode
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
  numberOfLines?: number
  disableFontScaling?: boolean
  minimumFontScale?: number

  /** DRY if if makes sense. Use or create an appropriate `___Text` component
   * instead. */
  style?: StyleProp<TextStyle>
}

// TODO: Rename to LabelText
export const EdgeText: React.FC<LabelProps> = (props: LabelProps) => {
  const { children, style, disableFontScaling = false, ...rest } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  let { numberOfLines = 1 } = props
  if (typeof children === 'string' && children.includes('\n')) {
    numberOfLines = numberOfLines + (children.match(/\n/g) ?? []).length
  }

  return (
    <Text
      allowFontScaling={false}
      style={[styles.common, style, androidAdjustTextStyle(theme)]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={!disableFontScaling}
      minimumFontScale={0.65}
      {...rest}
      {...minimumFontSizeProps(
        [styles.common, style],
        rest.minimumFontScale ?? 0.65,
        theme.rem(1)
      )}
    >
      {children}
    </Text>
  )
}

/** Makes the contents of an `EdgeText` or `Paragraph` smaller (0.75rem).
 * Unless used within a `Paragraph` block, provides no outer spacing. */
export const SmallText: React.FC<{ children: React.ReactNode }> = (props: {
  children: React.ReactNode
}) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Text
      allowFontScaling={false}
      style={[styles.sizeSmall, androidAdjustTextStyle(theme)]}
    >
      {children}
    </Text>
  )
}

/** Makes the contents of an `EdgeText` or `Paragraph` orange, for warnings.
 * Unless used within a `Paragraph` block, provides no outer spacing. */
export const WarningText: React.FC<{ children: React.ReactNode }> = (props: {
  children: React.ReactNode
}) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Text
      allowFontScaling={false}
      style={[styles.colorWarning, androidAdjustTextStyle(theme)]}
    >
      {children}
    </Text>
  )
}

/** Makes the contents of an `EdgeText` or `Paragraph` large (1.5rem).
 * Unless used within a `Paragraph` block, provides no outer spacing. */
export const HeaderText: React.FC<{ children: React.ReactNode }> = (props: {
  children: React.ReactNode
}) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Text
      allowFontScaling={false}
      style={[styles.sizeHeader, androidAdjustTextStyle(theme)]}
    >
      {children}
    </Text>
  )
}

// #endregion Typography

const getStyles = cacheStyles((theme: Theme) => ({
  androidAdjust: {
    top: -1
  },
  common: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false
  },

  colorWarning: {
    color: theme.warningText
  },
  sizeSmall: {
    fontSize: theme.rem(0.75)
  },
  sizeHeader: {
    fontSize: theme.rem(1.5)
  },
  alignCenter: {
    textAlign: 'center'
  }
}))
