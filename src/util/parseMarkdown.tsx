import { lexer, type MarkedToken } from 'marked'
import * as React from 'react'
import { View } from 'react-native'

import { styled } from '../components/hoc/styled'
import { UnscaledText } from '../components/text/UnscaledText'
import { EdgeText } from '../components/themed/EdgeText'

/**
 * Converts markdown formatted text into ReactNodes. The currently supported
 * markdown syntax:
 *
 * - Paragraphs
 * - Emphasis
 * - Strong (Bold)
 * - Lists
 *
 * @param str Markdown formatted text string.
 * @returns A ReactNode which can be inserted directly into JSX.
 */
export function parseMarkdown(str: string): React.ReactNode {
  const tokens = lexer(str)

  const nodes: React.ReactNode[] = []
  for (const [index, token] of tokens.entries()) {
    const reactNode = tokenToReactNode(token as MarkedToken, index.toString())
    nodes.push(reactNode)
  }
  return <Markdown>{nodes}</Markdown>
}

function tokenToReactNode(
  token: MarkedToken,
  key: string
): React.ReactNode | null {
  const subTokens =
    'tokens' in token
      ? token.tokens?.map((token, index): React.ReactNode | null =>
          tokenToReactNode(token as MarkedToken, `${key}-${index}`)
        )
      : undefined
  switch (token.type) {
    case 'text': {
      // Use Marked's built-in inline parsing for bold/italic
      if (token.text.includes('**') || token.text.includes('*')) {
        try {
          const inlineTokens = lexer(token.text)
          return inlineTokens.map(
            (inlineToken, index): React.ReactNode | null =>
              tokenToReactNode(
                inlineToken as MarkedToken,
                `${key}-inline-${index}`
              )
          )
        } catch {
          // Fallback to plain text if inline parsing fails
          return token.text
        }
      }
      return token.text
    }
    case 'paragraph': {
      return <Paragraph>{subTokens ?? token.text}</Paragraph>
    }
    case 'em': {
      return <Em>{subTokens ?? token.text}</Em>
    }
    case 'strong': {
      return <Strong>{subTokens ?? token.text}</Strong>
    }
    case 'list': {
      return (
        <Ol>
          {token.items.map((item, index): React.ReactNode | null =>
            tokenToReactNode(item, `${key}-${index}`)
          )}
        </Ol>
      )
    }
    case 'list_item': {
      return (
        <Li key={key}>
          <LiBullet>
            <EdgeText>
              {/^[\s]*([*\-\d.]+)/.exec(token.raw)?.[1] ?? '*'}
            </EdgeText>
          </LiBullet>
          <LiContent>{subTokens ?? token.text}</LiContent>
        </Li>
      )
    }
    default: {
      console.warn(`Unexpected token type ${token.type} in markdown parser.`)
      return null
    }
  }
}

const Markdown = styled(View)(theme => ({
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'flex-start',
  margin: theme.rem(0.5)
}))

const Paragraph = styled(UnscaledText)(theme => ({
  paddingVertical: theme.rem(0.25),
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(1)
}))

const Em = styled(UnscaledText)(theme => ({
  color: theme.emphasizedText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(1)
}))

const Strong = styled(UnscaledText)(theme => ({
  fontFamily: theme.fontFaceMedium,
  fontSize: theme.rem(1),
  color: theme.primaryText
}))

const Ol = styled(View)(theme => ({
  alignItems: 'flex-start',
  flexDirection: 'column',
  paddingVertical: theme.rem(0.25)
}))

const Li = styled(View)(theme => ({
  alignItems: 'flex-start',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  paddingVertical: theme.rem(0.25)
}))

const LiBullet = styled(View)(theme => ({
  width: theme.rem(1) // Fixed width for all bullet numbers/letters
}))

const LiContent = styled(UnscaledText)(theme => ({
  flexShrink: 1,
  color: theme.primaryText,
  fontFamily: theme.fontFaceDefault,
  fontSize: theme.rem(1)
}))
