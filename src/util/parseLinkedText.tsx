import * as React from 'react'
import type { TextStyle } from 'react-native'

import { EdgeText } from '../components/themed/EdgeText'

/**
 * Parses a localized string with {{link}}...{{/link}} markers and returns
 * React nodes with the link portion wrapped in a tappable EdgeText component.
 *
 * This allows translators to place the link anywhere in the sentence while
 * maintaining proper localization.
 *
 * Example:
 *   Input: "By sliding, you agree to the {{link}}terms{{/link}}."
 *   Output: ["By sliding, you agree to the ", <TappableLink>, "."]
 *
 * @param text The localized string containing {{link}}...{{/link}} markers
 * @param onLinkPress Callback when the link is pressed
 * @param linkStyle Style to apply to the tappable link text
 * @returns React nodes that can be rendered directly in JSX
 */
export const parseLinkedText = (
  text: string,
  onLinkPress: () => void,
  linkStyle?: TextStyle
): React.ReactNode => {
  const match = /^(.*){{link}}(.+){{\/link}}(.*)$/.exec(text)
  if (match == null) return text

  const [, before, linkText, after] = match
  return (
    <>
      {before}
      <EdgeText style={linkStyle} onPress={onLinkPress}>
        {linkText}
      </EdgeText>
      {after}
    </>
  )
}
