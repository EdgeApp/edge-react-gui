import { describe, expect, it } from '@jest/globals'

import { resolveDeclaredFields } from '../../../scripts/extractRoutes'

/**
 * What the generator reads out of a `route()` declaration's source.
 *
 * Optionality cannot come from the type — `asOptional(asUnknown)` resolves
 * to plain `unknown`, because `unknown` absorbs `undefined` — so it is read
 * from the source by a resolver that follows names, import aliases, `doc()`
 * wrappers, `.withRest` chains and spreads. That resolver decides every
 * `"required"` in `src/cli/generated/commands.json`, and
 * `commands/generated.ts` throws `Missing --<flag>` on a required arg, so a
 * field resolved wrongly makes the client refuse a command the engine would
 * accept. No gate could see it: `docs:api:check` regenerates and compares
 * against the committed artifact, and `docs:api:committed` compares that
 * artifact to git, so a half-landed resolver passes both.
 */
describe('resolveDeclaredFields', () => {
  it('reads an inline asObject literal', () => {
    const { optional, prose } = resolveDeclaredFields(
      `
      const route = (x: unknown) => x
      const asObject = (x: unknown) => x
      const asOptional = (x: unknown) => x
      const asString = (x: unknown) => x
      const doc = (x: unknown, text: string) => x
      export const r = route({
        query: asObject({
          walletId: doc(asString, 'Which wallet.'),
          since: asOptional(doc(asString, 'From when.'))
        })
      })
      `,
      'query'
    )
    expect(optional).toStrictEqual(['since'])
    expect(prose).toStrictEqual({
      walletId: 'Which wallet.',
      since: 'From when.'
    })
  })

  it('follows a named constant, and a `.withRest` chain', () => {
    const { optional, prose } = resolveDeclaredFields(
      `
      const route = (x: unknown) => x
      const asObject = (x: unknown) => ({ withRest: x })
      const asOptional = (x: unknown) => x
      const asString = (x: unknown) => x
      const doc = (x: unknown, text: string) => x
      const asThing = asObject({
        id: doc(asString, 'The id.'),
        note: asOptional(doc(asString, 'A note.'))
      }).withRest
      export const r = route({ body: asThing })
      `,
      'body'
    )
    expect(optional).toStrictEqual(['note'])
    expect(prose.id).toBe('The id.')
    expect(prose.note).toBe('A note.')
  })

  it('reads a spread field group, prose and optionality alike', () => {
    // The shape a hand edit breaks: the group is a bare object literal, not
    // an `asObject()` call, and both resolvers have to recurse into it.
    const { optional, prose } = resolveDeclaredFields(
      `
      const route = (x: unknown) => x
      const asObject = (x: unknown) => x
      const asOptional = (x: unknown) => x
      const asString = (x: unknown) => x
      const doc = (x: unknown, text: string) => x
      const sharedFields = {
        shared: asOptional(doc(asString, 'Shared, and optional.'))
      }
      export const r = route({
        query: asObject({
          ...sharedFields,
          own: doc(asString, 'This route’s own.')
        })
      })
      `,
      'query'
    )
    expect(optional).toStrictEqual(['shared'])
    expect(prose.shared).toBe('Shared, and optional.')
    expect(prose.own).toBe('This route’s own.')
  })

  it('reads prose through a doc() wrapper on the whole cleaner', () => {
    const { prose } = resolveDeclaredFields(
      `
      const route = (x: unknown) => x
      const asObject = (x: unknown) => x
      const asString = (x: unknown) => x
      const doc = (x: unknown, text: string) => x
      export const r = route({
        returns: doc(asObject({ id: doc(asString, 'The id.') }), 'The thing.')
      })
      `,
      'returns'
    )
    // `''` is the prose for the response as a whole; a nested field's prose
    // is not the response's.
    expect(prose['']).toBe('The thing.')
    expect(prose.id).toBe('The id.')
  })

  it('finds nothing where there is no literal to read', () => {
    const { optional, prose } = resolveDeclaredFields(
      `
      const route = (x: unknown) => x
      const asObject = (x: unknown) => x
      const asUnknown = (x: unknown) => x
      export const r = route({ returns: asObject(asUnknown) })
      `,
      'returns'
    )
    expect(optional).toStrictEqual([])
    expect(prose).toStrictEqual({})
  })
})
