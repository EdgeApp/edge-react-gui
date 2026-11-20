import type { Subscriber } from 'yaob'
import { type Events, makeEvents } from 'yavent'

type Watchable<T extends object> = {
  watch: Subscriber<T>
} & T

export function withWatchableProps<T extends Watchable<any>>(
  original: Omit<T, 'watch'>
): T {
  const [watch, emit]: Events<T> = makeEvents<T>()
  const out: T = { ...original, watch } as any

  const keys = Object.keys(original) as Array<keyof typeof original & string>
  for (const key of keys) {
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
