import { Cleaner } from 'cleaners'

export function asGraceful<T>(asT: Cleaner<T>, msg: string): Cleaner<T> {
  return (raw: unknown) => {
    try {
      return asT(raw)
    } catch (error) {
      // @ts-expect-error
      error.message = `${msg}: ${error.message}`
      throw error
    }
  }
}
