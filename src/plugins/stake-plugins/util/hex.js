// @flow
import { mul } from 'biggystring'

export const toHex = (value: string): string => {
  return mul(value, '1', 16)
}

export const fromHex = (value: string): string => {
  return mul(value, '1', 10)
}
