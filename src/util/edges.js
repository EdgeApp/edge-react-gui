// @flow

type Edges = {
  bottom: number,
  left: number,
  right: number,
  top: number
}

/**
 * Interprets an array of numbers as a list of 0-4 numbers as a
 * web CSS `[top, right, bottom, left]` shorthand.
 * @deprecated Use `fixSides`, `sidesToPadding`, or `sidesToMargin` instead.
 */
export function unpackEdges(edges: number[] | number = 0): Edges {
  const array = typeof edges === 'number' ? [edges] : edges
  const top = array[0] != null ? array[0] : 0
  const right = array[1] != null ? array[1] : top
  const bottom = array[2] != null ? array[2] : top
  const left = array[3] != null ? array[3] : right

  return { top, right, bottom, left }
}
