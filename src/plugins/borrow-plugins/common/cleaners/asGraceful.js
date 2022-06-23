// @flow

import { type Cleaner } from 'cleaners'

export function asGraceful<T>(asT: Cleaner<T>, msg: string): Cleaner<T> {
  return (raw: mixed) => {
    try {
      return asT(raw)
    } catch (error) {
      error.message = `${msg}: ${error.message}`
      throw error
    }
  }
}
