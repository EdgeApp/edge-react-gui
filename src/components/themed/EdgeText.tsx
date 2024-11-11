import * as React from 'react'
import { Platform, StyleProp, Text, TextProps, TextStyle } from 'react-native'

import { fixSides, mapSides, sidesToMargin } from '../../util/sides'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

export const androidAdjustTextStyle = (theme: Theme) => {
  const styles = getStyles(theme)
  return Platform.OS === 'android' ? styles.androidAdjust : null
}

// #region Spacing & Alignment =================================================

/** A properly spaced block of text with default font color and size. Children
 * that are wrapped in other `___Text` component types will override those defaults.
 *
 * A `Paragraph` *can* have `marginRem`, but *only* to avoid an extra `View` for
 * spacing out `Paragraph(s)` in relation to their parent, *NOT* to give special
 * spacing *between* `Paragraphs` */
export const Paragraph = (props: {
  children: React.ReactNode

  center?: boolean
  /** @deprecated A `Paragraph` *can* have `marginRem`, but *only* to avoid an extra `View` for spacing out `Paragraph(s)` in relation to their parent, *NOT* to give special spacing *between* `Paragraphs`. It's still preferable to have the parents deal with spacing outside of `Paragraphs`. */
  marginRem?: number[] | number
}) => {
  const { center = false, children, marginRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))

  return (
    <Text style={[styles.common, margin, center && styles.alignCenter, androidAdjustTextStyle(theme)]} numberOfLines={0} adjustsFontSizeToFit={false}>
      {children}
    </Text>
  )
}

// #endregion Spacing & Alignment

// #region Typography ==========================================================

interface LabelProps extends TextProps {
  children: React.ReactNode
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip'
  numberOfLines?: number
  disableFontScaling?: boolean
  minimumFontScale?: number

  /** @deprecated Use or create an appropriate `___Text` component instead */
  style?: StyleProp<TextStyle>
}

// TODO: Rename to LabelText
export const EdgeText = (props: LabelProps) => {
  const { children, style, disableFontScaling = false, ...rest } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  let { numberOfLines = 1 } = props
  if (typeof children === 'string' && children.includes('\n')) {
    numberOfLines = numberOfLines + (children.match(/\n/g) ?? []).length
  }

  return (
    <Text
      style={[styles.common, style, androidAdjustTextStyle(theme)]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={!disableFontScaling}
      minimumFontScale={0.65}
      {...rest}
    >
      {children}
    </Text>
  )
}

/** Makes the contents of an `EdgeText` or `Paragraph` smaller (0.75rem).
 * Unless used within a `Paragraph` block, provides no outer spacing. */
export const SmallText = (props: { children: React.ReactNode }) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return <Text style={[styles.sizeSmall, androidAdjustTextStyle(theme)]}>{children}</Text>
}

/** Makes the contents of an `EdgeText` or `Paragraph` orange, for warnings.
 * Unless used within a `Paragraph` block, provides no outer spacing. */
export const WarningText = (props: { children: React.ReactNode }) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return <Text style={[styles.colorWarning, androidAdjustTextStyle(theme)]}>{children}</Text>
}

/** Makes the contents of an `EdgeText` or `Paragraph` large (1.5rem).
 * Unless used within a `Paragraph` block, provides no outer spacing. */
export const HeaderText = (props: { children: React.ReactNode }) => {
  const { children } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return <Text style={[styles.sizeHeader, androidAdjustTextStyle(theme)]}>{children}</Text>
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
