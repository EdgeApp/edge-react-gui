import * as React from 'react'

import { EdgeButton } from '../buttons/EdgeButton'

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

  // True to show a spinner after the contents:
  spinner?: boolean

  // Which visual style to use. Defaults to primary (solid):
  type?: MainButtonType

  // From EdgeButton
  layout?: 'row' | 'column' | 'solo'
}

/**
 * @deprecated
 * Use EdgeButton instead, and consider whether there is a genuine need for
 * special margins in MainButton use cases from a UI4 design perspective.
 */
export function MainButton(props: Props) {
  const { children, disabled = false, label, marginRem, onPress, type = 'primary', layout, spinner = false } = props

  return (
    <EdgeButton
      disabled={disabled}
      label={label}
      marginRem={marginRem}
      onPress={onPress}
      spinner={spinner}
      type={type === 'escape' ? 'tertiary' : type}
      layout={layout}
    >
      {children}
    </EdgeButton>
  )
}
