import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import {
  getSubcategories,
  setNewSubcategory
} from '../../actions/CategoriesActions'
import { missingFileError } from '../../util/fake/fakeDisklet'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

/** An account whose synced disklet records what was written to it. */
function makeAccount(opts: { synced?: string; error?: Error }): {
  account: EdgeAccount
  written: string[]
  paths: string[]
} {
  const written: string[] = []
  const paths: string[] = []
  const account = {
    disklet: {
      getText: async () => {
        if (opts.error != null) throw opts.error
        if (opts.synced == null) throw missingFileError()
        return opts.synced
      },
      setText: async (path: string, text: string) => {
        paths.push(path)
        written.push(text)
      }
    }
  } as unknown as EdgeAccount
  return { account, written, paths }
}

/** Enough of the store for a thunk that reads `state.core.account`. */
function run(
  account: EdgeAccount,
  subcategories: string[],
  thunk = setNewSubcategory('Expense:Beans')
): { dispatched: unknown[]; done: Promise<void> } {
  const dispatched: unknown[] = []
  const dispatch = (action: unknown): unknown => {
    dispatched.push(action)
    return action
  }
  const getState = (): unknown => ({
    core: { account },
    ui: { subcategories }
  })
  return {
    dispatched,
    done: thunk(dispatch as any, getState as any) as any
  }
}

/**
 * Adding a subcategory merges into the file, not into the redux copy.
 *
 * The redux list is only as good as the read that filled it, and a read that
 * *failed* leaves it at the reducer's initial `[]`: `getSubcategories`
 * rejects, `useAsyncEffect` turns that into a toast, and `CategoryModal`
 * stays open on an empty list. The first category the user then picks wrote
 * that empty list back plus one entry — replacing the whole synced list, on
 * every device, which is the loss the strict read was added to prevent
 * arriving through the other door.
 */
describe('setNewSubcategory', () => {
  it('merges into what is on disk, not into the redux list', async () => {
    const onDisk = ['Expense:Coffee', 'Income:Pay']
    const { account, written } = makeAccount({
      synced: JSON.stringify({ categories: onDisk })
    })
    // Redux is empty, as it is after a failed read.
    const { done } = run(account, [])
    await done
    expect(written).toHaveLength(1)
    expect(JSON.parse(written[0]).categories).toStrictEqual([
      'Expense:Beans',
      ...onDisk
    ])
  })

  it('refuses the write when the file cannot be read', async () => {
    const { account, written } = makeAccount({
      error: new Error('Could not decrypt Categories.json')
    })
    const { done } = run(account, ['Expense:Coffee'])
    await done
    // Nothing written, and nothing dispatched as if it had been.
    expect(written).toStrictEqual([])
  })

  it('keeps an unparseable file aside and starts again from the defaults', async () => {
    // Refusing was a one-way door: nothing rewrote the file, so every add
    // failed and the modal stayed empty on every device.
    const { account, written, paths } = makeAccount({
      synced: '{"categories":["Expense:Mi'
    })
    const { done, dispatched } = run(account, [])
    await done
    expect(paths[0]).toMatch(/^Categories\.json\.unreadable-\d+$/)
    expect(written[0]).toBe('{"categories":["Expense:Mi')
    expect(paths[1]).toBe('Categories.json')
    const next = JSON.parse(written[1]).categories
    expect(next).toContain('Expense:Beans')
    expect(next.length).toBeGreaterThan(100)
    expect(dispatched).toHaveLength(1)
  })

  it('writes the defaults plus one for a fresh account', async () => {
    // An absent file is the one case the defaults are right for, and the
    // reader writes them; the add then merges into them.
    const { account, written } = makeAccount({})
    const { done } = run(account, [])
    await done
    const last = JSON.parse(written[written.length - 1]).categories
    expect(last).toContain('Expense:Beans')
    expect(last.length).toBeGreaterThan(100)
  })

  it('keeps both entries when two writers race on a fresh account', async () => {
    // The property `serializeByKey` was added for, driven the way
    // `exportTxInfo.test.ts` drives its own: two writers at once, the
    // file absent, so each read sees no file and merges only its own
    // entry. Whichever `setText` lands last used to be the whole answer.
    let text: string | undefined
    const written: string[] = []
    const account = {
      disklet: {
        getText: async () => {
          if (text == null) throw missingFileError()
          return text
        },
        setText: async (_path: string, next: string) => {
          // A real disklet write is not instantaneous, and the lock is
          // what has to span the read *and* the write.
          await new Promise(resolve => setTimeout(resolve, 5))
          text = next
          written.push(next)
        }
      }
    } as unknown as EdgeAccount

    // `jestSetup.js` fakes every timer, and the delay above has to elapse.
    jest.useRealTimers()
    await Promise.all([
      run(account, [], setNewSubcategory('Expense:Beans')).done,
      run(account, [], setNewSubcategory('Expense:Rice')).done
    ])
    expect(written).toHaveLength(2)
    const last: string[] = JSON.parse(written[1]).categories
    expect(last).toContain('Expense:Beans')
    expect(last).toContain('Expense:Rice')
    jest.useFakeTimers()
  })

  it('does not duplicate a category the file already has', async () => {
    const { account, written } = makeAccount({
      synced: JSON.stringify({ categories: ['Expense:Beans'] })
    })
    const { done } = run(account, [])
    await done
    expect(JSON.parse(written[0]).categories).toStrictEqual(['Expense:Beans'])
  })
})

/**
 * The mount read and the add are ordered against each other.
 *
 * `getSubcategories` read and dispatched outside the serialization key, so
 * the two dispatches were unordered. `CategoryModal` fires it on mount and
 * leaves the rows tappable for the whole disklet round trip, so a mount read
 * that resolved after the add had written overwrote Redux with the pre-add
 * list: the row the user just created vanished from `state.ui.subcategories`
 * while the synced file held it, and the next open wrote the same entry
 * again because `handleCategoryUpdate`'s `includes` gate failed.
 */
describe('getSubcategories against a concurrent add', () => {
  it('dispatches the post-add list, not the list it started reading', async () => {
    let stored = '{"categories":["Expense:Rent"]}'
    // A read slow enough to finish after the add — the modal-mount window.
    let releaseRead: () => void = () => {}
    const held = new Promise<void>(resolve => {
      releaseRead = resolve
    })
    let reads = 0
    const account = {
      rootLoginId: 'login-1',
      disklet: {
        getText: async () => {
          if (++reads === 1) await held
          return stored
        },
        setText: async (_path: string, text: string) => {
          stored = text
        }
      }
    } as unknown as EdgeAccount

    const read = run(account, [], getSubcategories())
    // Let the read reach its `await`, then start the add behind it.
    await Promise.resolve()
    const add = run(account, [], setNewSubcategory('Expense:Beans'))

    releaseRead()
    await read.done
    await add.done

    const lists = [...read.dispatched, ...add.dispatched].map(
      (action: any) => action.data.subcategories
    )
    // Whatever order the dispatches land in, the last one is the file's
    // current contents — which is only true if the read runs inside the key.
    expect(JSON.parse(stored).categories).toStrictEqual([
      'Expense:Beans',
      'Expense:Rent'
    ])
    expect(lists[lists.length - 1]).toStrictEqual([
      'Expense:Beans',
      'Expense:Rent'
    ])
  })
})

/**
 * No dispatch for a list Redux already holds.
 *
 * Every `CategoryModal` mount reads the file, and the common answer is the
 * list already in `state.ui.subcategories` — a fresh array each time, which
 * re-rendered the modal and rebuilt its sorted rows for nothing.
 */
describe('getSubcategories when nothing changed', () => {
  const account = (text: string): EdgeAccount =>
    ({
      rootLoginId: 'login-2',
      disklet: {
        getText: async () => text,
        setText: async () => {}
      }
    } as unknown as EdgeAccount)

  it('does not dispatch the same list again', async () => {
    const held = ['Expense:Rent', 'Income:Salary']
    const { dispatched, done } = run(
      account(JSON.stringify({ categories: [...held] })),
      held,
      getSubcategories()
    )
    await done
    expect(dispatched).toStrictEqual([])
  })

  it('dispatches when the file holds something different', async () => {
    const { dispatched, done } = run(
      account(JSON.stringify({ categories: ['Expense:Rent', 'Expense:New'] })),
      ['Expense:Rent'],
      getSubcategories()
    )
    await done
    expect(dispatched).toHaveLength(1)
  })

  it('treats a reorder as a change', async () => {
    // Order is the list's own, so a reorder is not "the same list".
    const { dispatched, done } = run(
      account(JSON.stringify({ categories: ['B', 'A'] })),
      ['A', 'B'],
      getSubcategories()
    )
    await done.then(() => {
      expect(dispatched).toHaveLength(1)
    })
  })
})

describe('getSubcategories on an unparseable file', () => {
  it('shows the standard list rather than none', async () => {
    const { account, written } = makeAccount({ synced: '[' })
    const { done, dispatched } = run(account, [], getSubcategories())
    await done
    expect(written).toStrictEqual([])
    const action = dispatched[0] as { data: { subcategories: string[] } }
    expect(action.data.subcategories.length).toBeGreaterThan(100)
  })
})
