// @flow

type Edges = {
  bottom: number,
  left: number,
  right: number,
  top: number
}

type MarginStyles = {
  marginTop: number,
  marginRight: number,
  marginButtom: number,
  marginLeft: number
}

type PaddingStyles = {
  paddingTop: number,
  paddingRight: number,
  paddingButtom: number,
  paddingLeft: number
}

/**
 * Interprets an array of numbers as a list of 0-4 numbers as a
 * web CSS `[top, right, bottom, left]` shorthand.
 */
export function unpackEdges(edges: number[] | number = 0): Edges {
  const array = typeof edges === 'number' ? [edges] : edges
  const top = array[0] != null ? array[0] : 0
  const right = array[1] != null ? array[1] : top
  const bottom = array[2] != null ? array[2] : top
  const left = array[3] != null ? array[3] : right

  return { top, right, bottom, left }
}

/**
 * Turns an `Edges` structure back into an array.
 */
export function packEdges(edges: Edges): number[] {
  const { top, right, bottom, left } = edges
  return [top, right, bottom, left]
}

function convertEdges(edges: Edges, converter: (edge: number) => number): Edges {
  return {
    top: converter(edges.top),
    right: converter(edges.right),
    bottom: converter(edges.bottom),
    left: converter(edges.left)
  }
}

export function getSpacingStyles(
  edges: number[] | number = 0,
  converter: (edge: number) => number,
  styleName: 'margin' | 'padding'
): { [key: string]: number } {
  const { top, right, bottom, left } = convertEdges(unpackEdges(edges), converter)

  return {
    [`${styleName}Top`]: top,
    [`${styleName}Right`]: right,
    [`${styleName}Bottom`]: bottom,
    [`${styleName}Left`]: left
  }
}

/**
 * Convert unpackEdges function result to a react-native margin styles
 */
export function getMarginSpacingStyles(edges: number[] | number = 0, converter: (edge: number) => number): MarginStyles {
  return (getSpacingStyles(edges, converter, 'margin'): MarginStyles)
}

/**
 * Convert unpackEdges function result to a react-native padding styles
 */
export function getPaddingSpacingStyles(edges: number[] | number = 0, converter: (edge: number) => number): PaddingStyles {
  return (getSpacingStyles(edges, converter, 'padding'): PaddingStyles)
}
