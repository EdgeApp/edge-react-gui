// @flow

import * as React from 'react'
import { Text, TouchableHighlight, TouchableOpacity, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { unpackEdges } from '../../util/edges.js'
import { type Theme, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'

type Props = {
  children?: React.Node,
  onPress?: () => void | Promise<void>,

  // If this is set, the component will insert a text node before the other children:
  // eslint-disable-next-line react/no-unused-prop-types
  label?: string,

  // If this is set, show a spinner:
  // eslint-disable-next-line react/no-unused-prop-types
  spinner?: boolean,

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  // eslint-disable-next-line react/no-unused-prop-types
  marginRem?: number[] | number,

  // The gap inside the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `padding` property. Defaults to 0.5.
  // eslint-disable-next-line react/no-unused-prop-types
  paddingRem?: number[] | number,

  // eslint-disable-next-line react/no-unused-prop-types
  disabled?: boolean
}

type ColorProps = {
  color: 'success' | 'danger' | 'default'
}

type SquareButtonProps = Props & ColorProps
type RadioButtonProps = Props & { value: boolean, right?: boolean }

export function SquareButton(props: SquareButtonProps) {
  const { children, label, color, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const colorStyleName = `${color}Button`

  return (
    <TouchableOpacity style={[styles.squareButton, spacingStyles(props, theme), styles[colorStyleName]]} onPress={onPress}>
      {label != null ? <Text style={styles.squareText}>{label}</Text> : null}
      {children}
    </TouchableOpacity>
  )
}

export function ButtonBox(props: Props) {
  const { children, onPress } = props
  const theme = useTheme()

  return (
    <TouchableOpacity onPress={onPress} style={spacingStyles(props, theme)}>
      {children}
    </TouchableOpacity>
  )
}

export function Radio(props: RadioButtonProps) {
  const { children, value, right, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <View style={spacingStyles(props, theme)}>
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
  const { text, onPress, paddingRem = 0 } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[spacingStyles({ marginRem: [0, 1.25, 0, 0], paddingRem }, theme), styles.rightChevronContainer]}>
        <EdgeText style={styles.rightChevronText}>{text}</EdgeText>
        <IonIcon name="chevron-forward" size={theme.rem(1.5)} color={theme.iconTappable} />
      </View>
    </TouchableOpacity>
  )
}

function spacingStyles(props: Props, theme: Theme) {
  const marginRem = unpackEdges(props.marginRem)
  const paddingRem = unpackEdges(props.paddingRem ?? 0.5)

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top),
    paddingBottom: theme.rem(paddingRem.bottom),
    paddingLeft: theme.rem(paddingRem.left),
    paddingRight: theme.rem(paddingRem.right),
    paddingTop: theme.rem(paddingRem.top)
  }
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
    squareButton: {
      height: '100%',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    squareText: {
      ...commonText,
      color: theme.primaryText
    },
    dangerButton: {
      backgroundColor: theme.sliderTabSend
    },
    defaultButton: {
      backgroundColor: theme.sliderTabMore
    },
    successButton: {
      backgroundColor: theme.sliderTabRequest
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
    buttonBox: {
      shadowColor: theme.buttonBoxShadow,
      shadowOffset: {
        width: 0,
        height: theme.rem(0.25)
      },
      shadowOpacity: 0.34,
      shadowRadius: theme.rem(0.25),

      elevation: theme.rem(0.5)
    },
    rightChevronContainer: {
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
