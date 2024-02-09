import * as React from 'react'

import { ButtonUi4 } from '../ui4/ButtonUi4'

export type MainButtonType = 'primary' | 'secondary' | 'escape'

interface Props {
  children?: React.ReactNode

  // Called when the user presses the button.
  // If the callback returns a promise, the button will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>

  // True to dim the button & prevent interactions:
  disabled?: boolean

  // If this is set, the component will insert a text node after its children:
  label?: string

  // The gap around the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `margin` property. Defaults to 0.
  marginRem?: number[] | number

  // The gap inside the button. Takes 0-4 numbers (top, right, bottom, left),
  // using the same logic as the web `padding` property. Defaults to 0.5.
  paddingRem?: number[] | number

  // True to show a spinner after the contents:
  spinner?: boolean

  // Which visual style to use. Defaults to primary (solid):
  type?: MainButtonType

  // From ButtonUi4
  layout?: 'row' | 'column' | 'solo'
}

/**
 * A stand-alone button to perform the primary action in a modal or scene.
 */
export function MainButton(props: Props) {
  const { children, disabled = false, label, marginRem, onPress, type = 'primary', paddingRem, layout, spinner = false } = props

  return (
    <ButtonUi4
      disabled={disabled}
      label={label}
      marginRem={marginRem}
      onPress={onPress}
      paddingRem={paddingRem}
      spinner={spinner}
      type={type === 'escape' ? 'tertiary' : type}
      layout={layout}
    >
      {children}
    </ButtonUi4>
  )
}
