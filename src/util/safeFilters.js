// @flow

export function filterUndefined<T>(items: Array<T | void>): T[] {
  return items
    .map(item => {
      const flowHack: any = item
      return flowHack
    })
    .filter(item => item != null)
}

export function filterNull<T>(items: Array<T | null>): T[] {
  return items
    .map(item => {
      const flowHack: any = item
      return flowHack
    })
    .filter(item => item != null)
}
