import React, { memo } from 'react'
import { Text } from 'react-native'

import { styled } from '../hoc/styled'

/**
 * Converts formatted text into ReactNodes. The currently supported formatting
 * rule-set is based on markdown:
 *
 * * Use asterisks around text to emphasize the text: \*emphasized\*
 *
 * @param str Formatted text with special formatting rules.
 * @returns An array of ReactNodes which can be inserted directly into JSX
 */

interface Props {
  children: string
}

const Em = styled(Text)(props => ({
  color: props.theme.emphasizedText
}))

export const parseMarkedText = (str: string) => {
  const regex = /(?<!\\)\*(.*?)(?<!\\)\*/g
  let match
  let lastIndex = 0
  const parsedArr: React.ReactNode[] = []

  while ((match = regex.exec(str)) !== null) {
    const startIndex = match.index
    const endIndex = regex.lastIndex - 2 // adjust for the asterisks
    if (startIndex > lastIndex) {
      const fixed = str.substring(lastIndex, startIndex).replace(/(\\)(\*)/g, '*') // Fix escaped markers
      parsedArr.push(fixed)
    }
    parsedArr.push(<Em>{str.substring(startIndex + 1, endIndex + 1)}</Em>)
    lastIndex = endIndex + 2
  }
  if (lastIndex < str.length) {
    const fixed = str.substring(lastIndex).replace(/(\\)(\*)/g, '*') // Fix escaped markers
    parsedArr.push(fixed)
  }
  return parsedArr
}

const MarkedTextComponent = ({ children }: Props) => {
  const parsedText = parseMarkedText(children)
  return <>{parsedText}</>
}

export const MarkedText = memo(MarkedTextComponent)
