import marked, { MarkedToken } from 'marked'
import * as React from 'react'
import { Text, View } from 'react-native'

import { styled } from '../components/hoc/styled'
import { EdgeText } from '../components/themed/EdgeText'

/**
 * Converts markdown formatted text into ReactNodes. The currently supported
 * markdown syntax:
 *
 * - Paragraphs
 * - Emphasis
 * - Lists
 *
 * @param str Markdown formatted text string.
 * @returns A ReactNode which can be inserted directly into JSX.
 */
export function parseMarkdown(str: string): React.ReactNode {
  const tokens = marked.lexer(str)

  const nodes: React.ReactNode[] = []
  for (const [index, token] of tokens.entries()) {
    const reactNode = tokenToReactNode(token as MarkedToken, index.toString())
    nodes.push(reactNode)
  }
  return <Markdown>{nodes}</Markdown>
}

function tokenToReactNode(token: MarkedToken, key: string): React.ReactNode {
  const subTokens = 'tokens' in token ? token.tokens?.map((token, index) => tokenToReactNode(token as MarkedToken, `${key}-${index}`)) : undefined
  switch (token.type) {
    case 'text': {
      return <EdgeText numberOfLines={1000}>{token.text}</EdgeText>
    }
    case 'paragraph': {
      console.log('P')
      return <Paragraph>{subTokens ?? token.text}</Paragraph>
    }
    case 'em': {
      return <Em>{subTokens ?? token.text}</Em>
    }
    case 'list': {
      console.log('OL')
      return <Ol>{token.items.map((item, index) => tokenToReactNode(item, `${key}-${index}`))}</Ol>
    }
    case 'list_item': {
      console.log('LI')
      return (
        <Li key={key}>
          <LiBullet>
            <EdgeText>{token.raw.match(/^[\s]*([*\-\d.]+)/)?.[1] ?? '*'}</EdgeText>
          </LiBullet>
          <LiContent>
            <EdgeText numberOfLines={1000}>{subTokens ?? token.text}</EdgeText>
          </LiContent>
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
  justifyContent: 'flex-start'
}))

const Paragraph = styled(View)(theme => ({
  // backgroundColor: 'pink',
  flexDirection: 'column',
  paddingVertical: theme.rem(0.25)
}))

const Em = styled(Text)(theme => ({
  color: theme.emphasizedText
}))

const Ol = styled(View)(theme => ({
  // backgroundColor: 'lightblue',
  alignItems: 'flex-start',
  flexDirection: 'column',
  paddingVertical: theme.rem(0.25)
}))

const Li = styled(View)(theme => ({
  // backgroundColor: 'lightgreen',
  alignItems: 'flex-start',
  flexDirection: 'row',
  justifyContent: 'flex-start',
  paddingVertical: theme.rem(0.25)
}))

const LiBullet = styled(View)(theme => ({
  width: theme.rem(1) // Fixed width for all bullet numbers/letters
}))

const LiContent = styled(View)(theme => ({
  flexShrink: 1,
  flexDirection: 'row'
}))
