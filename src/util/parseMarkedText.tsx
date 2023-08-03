import * as React from 'react'
import { Text } from 'react-native'

import { styled } from '../components/hoc/styled'

/**
 * Converts formatted text into ReactNodes. The currently supported formatting
 * rule-set is based on markdown:
 *
 * * Use asterisks around text to emphasize the text: \*emphasized\*
 *
 * @param str Formatted text with special formatting rules.
 * @returns An array of ReactNodes which can be inserted directly into JSX
 */
export function parseMarkedText(str: string): React.ReactNode[] {
  const regex = /(?<!\\)\*(.*?)(?<!\\)\*/g
  let match
  let lastIndex = 0
  const parsedArr: React.ReactNode[] = []
  let lastKey = 0

  while ((match = regex.exec(str)) !== null) {
    const startIndex = match.index
    const endIndex = regex.lastIndex - 2 // adjust for the asterisks
    if (startIndex > lastIndex) {
      const fixed = str.substring(lastIndex, startIndex).replace(/(\\)(\*)/g, '*') // Fix escaped markers
      parsedArr.push(fixed)
    }
    parsedArr.push(<Em key={`em${lastKey++}`}>{str.substring(startIndex + 1, endIndex + 1)}</Em>)
    lastIndex = endIndex + 2
  }
  if (lastIndex < str.length) {
    const fixed = str.substring(lastIndex).replace(/(\\)(\*)/g, '*') // Fix escaped markers
    parsedArr.push(fixed)
  }
  return parsedArr
}

const Em = styled(Text)(theme => ({
  color: theme.emphasizedText
}))
