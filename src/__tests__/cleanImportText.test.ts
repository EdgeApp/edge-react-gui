import { describe, expect, test } from '@jest/globals'

import { cleanupImportText } from '../components/scenes/CreateWalletImportScene'

describe('cleanupImportText', function () {
  test('handles good inputs', function () {
    expect(cleanupImportText('super smol test mnemonic seed phrase')).toBe('super smol test mnemonic seed phrase')
    expect(cleanupImportText('14HyjvA79tpVwqdxvHZe4emcuskYSKnTCU')).toBe('14HyjvA79tpVwqdxvHZe4emcuskYSKnTCU')
  })

  test('trims whitespace characters', function () {
    expect(cleanupImportText('super smol test mnemonic seed phrase ')).toBe('super smol test mnemonic seed phrase')
    expect(cleanupImportText('\n\n\n\nsuper smol test mnemonic seed phrase\n')).toBe('super smol test mnemonic seed phrase')
    expect(cleanupImportText('\r\t\f14HyjvA79tpVwqdxvHZe4emcuskYSKnTCU ')).toBe('14HyjvA79tpVwqdxvHZe4emcuskYSKnTCU')
  })

  test('removes extra spaces from phrases', function () {
    expect(cleanupImportText('super              smol   test mnemonic seed phrase  ')).toBe('super smol test mnemonic seed phrase')
  })

  test('normalize capitalization for phrases', function () {
    expect(cleanupImportText('sUpEr smOL tEst mnEmOnIc sEEd phrAsE')).toBe('super smol test mnemonic seed phrase')
  })
})
