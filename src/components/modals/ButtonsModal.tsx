import * as React from 'react'
import { View, ViewStyle } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'
import { ButtonTypeUi4, ButtonUi4 } from '../ui4/ButtonUi4'
import { ModalUi4 } from '../ui4/ModalUi4'

export interface ButtonInfo {
  label: string
  type?: ButtonTypeUi4

  // The modal will show a spinner as long as this promise is pending.
  // Returning true will dismiss the modal,
  // but returning false will leave the modal up.
  // Although multiple buttons can be spinning at once,
  // a spinning button cannot be clicked again until the promise resolves.
  onPress?: () => Promise<boolean>
}

export interface ButtonModalProps<Buttons> {
  bridge: AirshipBridge<keyof Buttons | undefined>
  buttons: Buttons
  /** Used to pass non-text children, to be rendered after the title and message
   * but before the buttons themselves. */
  children?: React.ReactNode
  /** No corner close button */
  disableCancel?: boolean
  /** Full height (flex: 1) */
  fullScreen?: boolean
  /** Main body message */
  message?: string
  /** Modal title */
  title?: string
  /** Adds a border around the modal */
  warning?: boolean

  /** @deprecated. Does nothing. */
  // eslint-disable-next-line react/no-unused-prop-types
  closeArrow?: boolean
}

/**
 * A modal with a title, message, and buttons.
 * This is an alternative to the native `Alert` component.
 *
 * Child components appear between the message and the buttons,
 * but this feature is only meant for inserting extra message elements,
 * like images or custom text formatting.
 *
 * Build a custom modal component if you need form fields, check boxes,
 * or other interactive elements.
 */
export function ButtonsModal<Buttons extends { [key: string]: ButtonInfo }>(props: ButtonModalProps<Buttons>) {
  const { bridge, title, message, children, buttons, disableCancel = false, fullScreen = false, warning } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = useHandler(() => bridge.resolve(undefined))

  const containerStyle: ViewStyle = {
    flex: fullScreen ? 1 : 0
  }

  return (
    <ModalUi4 warning={warning} bridge={bridge} title={title} onCancel={disableCancel ? undefined : handleCancel}>
      <View style={[styles.textStyle, containerStyle]}>
        {message != null ? <Paragraph>{message}</Paragraph> : null}
        {children}
      </View>
      <View style={styles.buttonsStyle}>
        <View style={styles.innerButtonStyle}>
          {Object.keys(buttons).map((key, i, arr) => {
            let defaultType: 'primary' | 'secondary'
            if (theme.preferPrimaryButton) {
              defaultType = i === 0 ? 'primary' : 'secondary'
            } else {
              defaultType = i === 0 && arr.length > 1 ? 'primary' : 'secondary'
            }
            const { type = defaultType, label, onPress } = buttons[key]

            const handlePress = (): Promise<void> | undefined => {
              if (onPress == null) {
                bridge.resolve(key)
                return
              }
              return onPress().then(
                result => {
                  if (result) bridge.resolve(key)
                },
                error => showError(error)
              )
            }

            return <ButtonUi4 key={key} label={label} marginRem={0.5} type={type} onPress={handlePress} layout="column" />
          })}
        </View>
      </View>
    </ModalUi4>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsStyle: {
    justifyContent: 'flex-end',
    marginTop: theme.rem(0.5)
  },
  // TODO:
  // Since we don't have clear definitions yet for primary/secondary/tertiary
  // button assignments, we can't use ButtonsViewUi4. For now, just style
  // the buttons with a shared width
  innerButtonStyle: {
    justifyContent: 'space-between',
    alignSelf: 'center', // Shrink view around buttons
    alignItems: 'stretch', // Stretch our children out
    flexDirection: 'column'
  },
  textStyle: {
    justifyContent: 'flex-start'
  }
}))
