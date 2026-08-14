import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import type * as DeviceSettingsActions from '../../actions/DeviceSettingsActions'
import type { DeviceSettings } from '../../types/types'

const FILENAME = 'DeviceSettings.json'

let mockFiles: Record<string, string> = {}
// Held open so a write can be issued while the initial load is still in flight.
let mockReadGate: Promise<void> = Promise.resolve()
let mockFailWrites = 0
// Optional per-write delay so overlapping writes can prove serialization.
let mockWriteHook: ((callIndex: number) => Promise<void>) | undefined
let mockWriteCallIndex = 0
const mockWriteCallOrder: string[] = []

jest.mock('disklet', () => ({
  makeReactNativeDisklet: () => ({
    getText: async (name: string): Promise<string> => {
      await mockReadGate
      const text = mockFiles[name]
      if (text == null) throw new Error(`${name} not found`)
      return text
    },
    setText: async (name: string, text: string): Promise<void> => {
      const callIndex = mockWriteCallIndex++
      mockWriteCallOrder.push(`start:${callIndex}`)
      if (mockWriteHook != null) await mockWriteHook(callIndex)
      if (mockFailWrites > 0) {
        mockFailWrites--
        mockWriteCallOrder.push(`fail:${callIndex}`)
        throw new Error('disk full')
      }
      mockFiles[name] = text
      mockWriteCallOrder.push(`end:${callIndex}`)
    }
  })
}))

const readFile = (): DeviceSettings => JSON.parse(mockFiles[FILENAME])

// Each case needs its own copy of the module's in-memory settings and its
// single-flighted load promise.
const freshModule = (): typeof DeviceSettingsActions => {
  let module: typeof DeviceSettingsActions
  jest.isolateModules(() => {
    module = require('../../actions/DeviceSettingsActions')
  })
  // @ts-expect-error assigned by the synchronous isolateModules callback
  return module
}

describe('patchDeviceSettings', () => {
  beforeEach(() => {
    mockFiles = {}
    mockReadGate = Promise.resolve()
    mockFailWrites = 0
    mockWriteHook = undefined
    mockWriteCallIndex = 0
    mockWriteCallOrder.length = 0
  })

  it('keeps fields already on disk when a write beats the initial load', async () => {
    // themeMode and defaultScreen both differ from the cleaner's defaults, so a
    // write built on the defaults instead of the file is visible here.
    mockFiles[FILENAME] = JSON.stringify({
      themeMode: 'light',
      defaultScreen: 'assets'
    })
    let openGate: () => void = () => {}
    mockReadGate = new Promise<void>(resolve => {
      openGate = resolve
    })

    const { initDeviceSettings, writeKeysCache } = freshModule()
    const loaded = initDeviceSettings()
    const written = writeKeysCache({
      keys: { EDGE_API_KEY: 'k' },
      fetchedAt: 1,
      assuranceLevel: 'default'
    })

    openGate()
    await Promise.all([loaded, written])

    const file = readFile()
    expect(file.themeMode).toBe('light')
    expect(file.defaultScreen).toBe('assets')
    expect(file.keysCache?.assuranceLevel).toBe('default')
  })

  it('preserves on-disk fields when write runs without initDeviceSettings first', async () => {
    mockFiles[FILENAME] = JSON.stringify({
      themeMode: 'light',
      defaultScreen: 'assets'
    })
    const { writeThemeMode } = freshModule()
    await writeThemeMode('dark')

    const file = readFile()
    expect(file.themeMode).toBe('dark')
    expect(file.defaultScreen).toBe('assets')
  })

  it('lands every field when writes overlap', async () => {
    mockFiles[FILENAME] = JSON.stringify({})
    const { initDeviceSettings, writeDefaultScreen, writeThemeMode } =
      freshModule()
    await initDeviceSettings()

    let releaseFirstWrite: () => void = () => {}
    const firstWriteHold = new Promise<void>(resolve => {
      releaseFirstWrite = resolve
    })
    let signalFirstStarted: () => void = () => {}
    const firstStarted = new Promise<void>(resolve => {
      signalFirstStarted = resolve
    })
    mockWriteHook = async (callIndex: number) => {
      if (callIndex === 0) {
        signalFirstStarted()
        await firstWriteHold
      }
    }

    const first = writeThemeMode('light')
    const second = writeDefaultScreen('assets')

    // Wait until the first setText is in flight, then prove the second has not
    // started while the first is still held open.
    await firstStarted
    expect(mockWriteCallOrder).toEqual(['start:0'])

    releaseFirstWrite()
    await Promise.all([first, second])

    expect(mockWriteCallOrder).toEqual(['start:0', 'end:0', 'start:1', 'end:1'])

    const file = readFile()
    expect(file.themeMode).toBe('light')
    expect(file.defaultScreen).toBe('assets')
  })

  it('does not let a failed write block later writes', async () => {
    mockFiles[FILENAME] = JSON.stringify({})
    const { initDeviceSettings, writeDefaultScreen, writeThemeMode } =
      freshModule()
    await initDeviceSettings()

    mockFailWrites = 1
    await expect(writeThemeMode('light')).rejects.toThrow('disk full')
    await writeDefaultScreen('assets')

    const file = readFile()
    expect(file.defaultScreen).toBe('assets')
    // The failed write's patch stayed in memory, so the next one carries it.
    expect(file.themeMode).toBe('light')
  })
})
