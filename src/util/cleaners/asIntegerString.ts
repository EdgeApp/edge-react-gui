import { asString, Cleaner } from 'cleaners'

export const asIntegerString: Cleaner<string> = raw => {
  const clean = asString(raw)
  if (!/^\d+$/.test(clean)) {
    throw new Error('Expected an integer string')
  }
  return clean
}
