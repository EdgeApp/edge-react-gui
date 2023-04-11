/**
 * A pending call into native code.
 */
interface PendingCall {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

/**
 * Maintains a list of pending native calls.
 */
interface PendingList {
  add: (call: PendingCall) => number
  grab: (id: number) => PendingCall
}

/**
 * Maps from call ID's to the dangling promise
 * that is waiting for the return value.
 */
export function makePendingList(): PendingList {
  const dummyCall: PendingCall = {
    resolve() {},
    reject() {}
  }
  let lastId: number = 0

  if (typeof Map !== 'undefined') {
    // Better map-based version:
    const map = new Map()
    return {
      add(call) {
        const id = ++lastId
        map.set(id, call)
        return id
      },
      grab(id) {
        const call = map.get(id)
        if (call == null) return dummyCall
        map.delete(id)
        return call
      }
    }
  }

  // Slower object-based version:
  const map: { [id: string]: PendingCall } = {}
  return {
    add(call) {
      const id = ++lastId
      map[String(id)] = call
      return id
    },
    grab(id) {
      const call = map[String(id)]
      if (call == null) return dummyCall
      delete map[String(id)]
      return call
    }
  }
}
