import { Subscriber } from 'yaob'
import { Events, makeEvents } from 'yavent'

type Watchable<T extends object> = {
  watch: Subscriber<T>
} & T

export function withWatchableProps<T extends Watchable<any>>(original: Omit<T, 'watch'>): T {
  const [watch, emit]: Events<T> = makeEvents<T>()
  const out: T = { ...original, watch } as any

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
