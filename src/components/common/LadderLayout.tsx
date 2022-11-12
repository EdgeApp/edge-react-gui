import * as React from 'react'
import { Image, Text, View } from 'react-native'

interface Props {
  children: React.ReactNode

  // Space to put between all items:
  padding: number

  // True to use a horizontal layout. Defaults to false:
  horizontal?: boolean
}

/**
 * Lays out a collection of children with equal space between each one.
 */
export function LadderLayout(props: Props): React.ReactElement {
  const { horizontal = false, padding } = props
  const children = React.Children.toArray(props.children)

  // We don't need to do anything in these cases:
  // @ts-expect-error
  if (children.length <= 1 || padding === 0) return children

  // Copy the array, inserting spacers if necessary:
  const newChildren = []
  let needsSpaceBefore = false
  for (let i = 0; i < children.length; ++i) {
    const child = children[i]
    const needsSpaceAfter = i + 1 < children.length

    const style = {}
    if (needsSpaceBefore) {
      // @ts-expect-error
      if (horizontal) style.marginLeft = padding
      // @ts-expect-error
      else style.marginTop = padding
    }
    if (needsSpaceAfter) {
      // @ts-expect-error
      if (horizontal) style.marginRight = padding
      // @ts-expect-error
      else style.marginBottom = padding
    }

    if (isStyled(child) && (needsSpaceBefore || needsSpaceAfter)) {
      // This child accepts a stylesheet, so use that for spacing:
      newChildren.push(
        // @ts-expect-error
        React.cloneElement(child, {
          // @ts-expect-error
          style: child.props.style == null ? style : Array.isArray(child.props.style) ? [...child.props.style, style] : [child.props.style, style]
        })
      )
      needsSpaceBefore = false
    } else if (needsSpaceBefore) {
      // Otherwise, wrap a view around this element:
      newChildren.push(
        <View key={`ladder${i}`} style={style}>
          {child}
        </View>
      )
      needsSpaceBefore = false
    } else {
      // Skip this element, and let the next one add spacing instead:
      newChildren.push(child)
      needsSpaceBefore = needsSpaceAfter
    }
  }

  return <>{newChildren}</>
}

// @ts-expect-error
function isStyled(element) {
  // @ts-expect-error
  return React.isValidElement(element) && (element.type === Image || element.type === Text || element.type === View || element.props.style != null)
}
