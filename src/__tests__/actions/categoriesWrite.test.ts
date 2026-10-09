import { describe, expect, it, jest } from '@jest/globals'
import type { EdgeAccount } from 'edge-core-js'

import { setNewSubcategory } from '../../actions/CategoriesActions'
import { missingFileError } from '../../util/fake/fakeDisklet'

jest.mock('../../components/services/AirshipInstance', () => ({
  showError: jest.fn()
}))

/** An account whose synced disklet records what was written to it. */
function makeAccount(opts: { synced?: string; error?: Error }): {
  account: EdgeAccount
  written: string[]
} {
  const written: string[] = []
  const account = {
    disklet: {
      getText: async () => {
        if (opts.error != null) throw opts.error
        if (opts.synced == null) throw missingFileError()
        return opts.synced
      },
      setText: async (_path: string, text: string) => {
        written.push(text)
      }
    }
  } as unknown as EdgeAccount
  return { account, written }
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
