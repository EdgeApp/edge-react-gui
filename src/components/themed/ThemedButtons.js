// @flow

import * as React from 'react'
import { TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { fixSides, mapSides, sidesToMargin, sidesToPadding } from '../../util/sides.js'
import { type Theme, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  children?: React.Node,
  onPress?: () => void | Promise<void>,

  // If this is set, the component will insert a text node before the other children:
  // eslint-disable-next-line react/no-unused-prop-types
  label?: string,

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number,

  // The gap inside the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `padding` property. Defaults to 0.5.
  paddingRem?: number[] | number,

  // eslint-disable-next-line react/no-unused-prop-types
  disabled?: boolean
}

type RadioButtonProps = Props & { value: boolean, right?: boolean }

export function ButtonBox(props: Props) {
  const { children, marginRem, paddingRem, onPress } = props
  const theme = useTheme()
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0.5), theme.rem))

  return (
    <TouchableOpacity onPress={onPress} style={[margin, padding]}>
      {children}
    </TouchableOpacity>
  )
}

export function Radio(props: RadioButtonProps) {
  const { children, marginRem, paddingRem, value, right, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const margin = sidesToMargin(mapSides(fixSides(marginRem, 0), theme.rem))
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0.5), theme.rem))

  return (
    <View style={[margin, padding]}>
      <TouchableHighlight activeOpacity={theme.underlayOpacity} underlayColor={theme.secondaryButton} onPress={onPress}>
        <View style={[styles.radio, right && styles.radioRight]}>
          <RadioIcon value={value} />
          {children}
        </View>
      </TouchableHighlight>
    </View>
  )
}

export function RadioIcon(props: { value: boolean }) {
  const { value } = props
  const theme = useTheme()

  const icon = value ? (
    <IonIcon size={theme.rem(1.25)} color={theme.iconTappable} name="ios-radio-button-on" />
  ) : (
    <IonIcon size={theme.rem(1.25)} color={theme.icon} name="ios-radio-button-off" />
  )

  return icon
}

export function RightChevronButton(props: { text: string, onPress: () => void, paddingRem?: number[] | number }) {
  const { text, onPress, paddingRem } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const padding = sidesToPadding(mapSides(fixSides(paddingRem, 0), theme.rem))

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[padding, styles.rightChevronContainer]}>
        <EdgeText style={styles.rightChevronText}>{text}</EdgeText>
        <IonIcon name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
      </View>
    </TouchableOpacity>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonText = {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1),
    marginVertical: theme.rem(0.25),
    marginHorizontal: theme.rem(0.5),
    includeFontPadding: false
  }

  return {
    primaryText: {
      ...commonText,
      color: theme.primaryButtonText
    },
    radio: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    radioRight: {
      flexDirection: 'row-reverse'
    },
    disabled: {
      opacity: 0.7
    },
    rightChevronContainer: {
      marginBottom: 0,
      marginLeft: 0,
      marginRight: theme.rem(1.25),
      marginTop: 0,
      flexDirection: 'row',
      alignItems: 'center'
    },
    rightChevronText: {
      marginRight: theme.rem(0.75),
      fontWeight: '600',
      fontSize: theme.rem(1.0)
    }
  }
})
