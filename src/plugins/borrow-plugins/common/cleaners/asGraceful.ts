import { Cleaner } from 'cleaners'

export function asGraceful<T>(asT: Cleaner<T>, msg: string): Cleaner<T> {
  return (raw: unknown) => {
    try {
      return asT(raw)
    } catch (error: any) {
      error.message = `${msg}: ${error.message}`
      throw error
    }
  }
}
