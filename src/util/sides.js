// @flow

/**
 * The four sides (top, right, bottom, left) as a tuple.
 */
export type SideList = [number, number, number, number]

export type Margin = {
  marginBottom: number,
  marginLeft: number,
  marginRight: number,
  marginTop: number
}

export type Padding = {
  paddingBottom: number,
  paddingLeft: number,
  paddingRight: number,
  paddingTop: number
}

/**
 * Interprets an array of 0-4 numbers as a web CSS sides shorthand
 * (top, right, bottom, left).
 */
export function fixSides(sides: number[] | number | void, fallback: number): SideList {
  if (sides == null) {
    return [fallback, fallback, fallback, fallback]
  }
  if (typeof sides === 'number') {
    return [sides, sides, sides, sides]
  }

  const top = sides[0] ?? fallback
  const right = sides[1] ?? top
  const bottom = sides[2] ?? top
  const left = sides[3] ?? right
  return [top, right, bottom, left]
}

export function mapSides(sides: SideList, f: (side: number) => number): SideList {
  return [f(sides[0]), f(sides[1]), f(sides[2]), f(sides[3])]
}

/**
 * Turns a list of sides into CSS margin properties.
 */
export function sidesToMargin(sides: SideList): Margin {
  return {
    marginTop: sides[0],
    marginRight: sides[1],
    marginBottom: sides[2],
    marginLeft: sides[3]
  }
}

/**
 * Turns a list of sides into CSS padding properties.
 */
export function sidesToPadding(sides: SideList): Padding {
  return {
    paddingTop: sides[0],
    paddingRight: sides[1],
    paddingBottom: sides[2],
    paddingLeft: sides[3]
  }
}
