// @flow

import * as React from 'react'
import { type TextStyle, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'

import { Fontello } from '../../assets/vector'
import { getMarginSpacingStyles, getPaddingSpacingStyles } from '../../util/edges'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

type Props = {
  textStyle: TextStyle,
  children: React.Node,
  value: boolean,
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip',
  numberOfLines?: number,
  disabled?: boolean,
  marginRem?: number[] | number,
  paddingRem?: number[] | number,
  onChange: (value: boolean) => void
}

export const Checkbox = ({ textStyle, disabled, children, value, onChange, marginRem, paddingRem, ellipsizeMode, numberOfLines }: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const spacings = {
    ...getMarginSpacingStyles(marginRem ?? 0.5, theme.rem),
    ...getPaddingSpacingStyles(paddingRem ?? 1, theme.rem)
  }

  return (
    <View style={[styles.container, spacings]}>
      <EdgeText style={[styles.label, textStyle]} ellipsizeMode={ellipsizeMode} numberOfLines={numberOfLines}>
        {children}
      </EdgeText>
      <TouchableWithoutFeedback onPress={() => onChange(!value)} disabled={disabled}>
        {value ? (
          <Fontello style={styles.checkbox} name="check-circle" size={theme.rem(1.1)} color={theme.iconTappable} />
        ) : (
          <Fontello style={styles.checkbox} name="uncheck-circle" size={theme.rem(1.1)} color={theme.iconTappable} />
        )}
      </TouchableWithoutFeedback>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.rem(1),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.defaultBorderColor,
    borderRadius: theme.cardBorderRadius
  },
  checkbox: {
    marginLeft: theme.rem(0.5)
  },
  label: {
    flex: 1
  }
}))
