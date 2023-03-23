import marked from 'marked'
import React, { memo } from 'react'
import { Linking, Text } from 'react-native'

import { styled } from '../hoc/styled'

/**
 * Converts formatted text into styled text. The currently supported formatting
 * rule-set is based on markdown:
 *
 * * Use asterisks around text to emphasize the text: \*emphasized\*
 * * Use [link](url) to open a URL
 *
 * @param children Formatted text with special formatting rules.
 * @returns An array of ReactNodes which can be inserted directly into JSX
 */

interface OwnProps {
  children?: React.ReactNode
}

export const EmText = styled(Text)(props => ({
  color: props.theme.emphasizedText
}))

export const LinkText = styled(Text)(props => ({
  color: props.theme.emphasizedText,
  textDecorationLine: 'underline'
}))

const parseMarkedToken = (token: marked.marked.Token): React.ReactNode[] => {
  if (token.type === 'text') {
    return [<Text key={Math.random()}>{token.text}</Text>]
  } else if (token.type === 'link') {
    return [
      <LinkText key={Math.random()} onPress={async () => Linking.openURL(token.href)}>
        {token.text}
      </LinkText>
    ]
  } else if (token.type === 'paragraph') {
    return [...token.tokens.flatMap(token => parseMarkedToken(token))]
  } else if (token.type === 'em') {
    return [<EmText key={Math.random()}>{token.text}</EmText>]
  } else {
    return []
  }
}

export const parseMarkedText = (markedStr: string): React.ReactNode[] => {
  const lexData = new marked.Lexer().lex(markedStr)
  let processedTokens: React.ReactNode[] = []

  for (let i = 0; i < lexData.length; i++) {
    const token = lexData[i]

    const parsedToken = parseMarkedToken(token)
    processedTokens = [...processedTokens, ...parsedToken]
  }

  return processedTokens
}

const MarkedTextComponent: React.FC<OwnProps> = ({ children }: OwnProps) => {
  if (children != null && typeof children === 'string') {
    const parsedText = parseMarkedText(children)
    return <>{parsedText}</>
  } else {
    return <></>
  }
}

export const MarkedText = memo(MarkedTextComponent)
