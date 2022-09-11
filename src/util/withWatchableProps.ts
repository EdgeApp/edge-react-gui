import { Subscriber } from 'yaob'
import { Events, makeEvents } from 'yavent'

type WatchableProps<T> = {
  // @ts-expect-error
  watch: Subscriber<T>
} & T

export function withWatchableProps<T extends {}>(original: T): WatchableProps<T> {
  const [watch, emit]: Events<T> = makeEvents<T>()
  const out = { ...original, watch }

  for (const key of Object.keys(original)) {
    Object.defineProperty(out, key, {
      configurable: true,
      enumerable: true,
      get() {
        // @ts-expect-error
        return original[key]
      },
      set(x) {
        // @ts-expect-error
        original[key] = x
        // @ts-expect-error
        emit(key, x)
      }
    })
  }

  return out
}
