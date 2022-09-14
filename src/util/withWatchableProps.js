// @flow

import { type Subscriber } from 'yaob'
import { type Events, makeEvents } from 'yavent'

type WatchableProps<T> = {
  watch: Subscriber<T>
} & T

export function withWatchableProps<T extends object>(original: T): WatchableProps<T> {
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
