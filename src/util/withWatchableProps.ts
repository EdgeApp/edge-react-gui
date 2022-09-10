

import { Subscriber } from 'yaob'
import { Events, makeEvents } from 'yavent'

type WatchableProps<T> = {
  watch: Subscriber<T>
} & T

export function withWatchableProps<T: Object>(original: T): WatchableProps<T> {
  const [watch, emit]: Events<T> = makeEvents<T>()
  const out = { ...original, watch }

  for (const key of Object.keys(original)) {
    Object.defineProperty(out, key, {
      configurable: true,
      enumerable: true,
      get() {
        return original[key]
      },
      set(x) {
        original[key] = x
        emit(key, x)
      }
    })
  }

  return out
}
