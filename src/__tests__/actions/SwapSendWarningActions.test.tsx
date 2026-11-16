import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { makeMemoryDisklet } from 'disklet'
import type * as React from 'react'

import { showSwapSendWarningModal } from '../../actions/SwapSendWarningActions'
import { Airship } from '../../components/services/AirshipInstance'
import { SWAP_SEND_WARNING } from '../../constants/constantSettings'

/** Answers every swap-send sheet without rendering it. */
const answerSheet = (agree: boolean): jest.SpiedFunction<typeof Airship.show> =>
  jest.spyOn(Airship, 'show').mockImplementation(async () => agree)

const isRecorded = async (
  disklet: ReturnType<typeof makeMemoryDisklet>
): Promise<boolean> =>
  await disklet.getText(SWAP_SEND_WARNING).then(
    () => true,
    () => false
  )

describe('showSwapSendWarningModal', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('records nothing and reports a decline when the sheet is dismissed', async () => {
    const disklet = makeMemoryDisklet()
    const show = answerSheet(false)

    expect(await showSwapSendWarningModal(disklet, 'Houdini')).toBe(true)
    expect(show).toHaveBeenCalledTimes(1)
    expect(await isRecorded(disklet)).toBe(false)
  })

  it('offers a way out without agreeing', async () => {
    const show = answerSheet(false)
    await showSwapSendWarningModal(makeMemoryDisklet(), 'Houdini')

    // A skippable sheet has a close button, and Back and a tap behind it
    // close it:
    const [[renderModal]] = show.mock.calls
    const modal = renderModal(undefined as never) as React.ReactElement<{
      isSkippable?: boolean
    }>
    expect(modal.props.isSkippable).toBe(true)
  })

  it('shows the sheet again after a dismissal', async () => {
    const disklet = makeMemoryDisklet()
    const show = answerSheet(false)

    await showSwapSendWarningModal(disklet, 'Houdini')
    expect(await showSwapSendWarningModal(disklet, 'Houdini')).toBe(true)
    expect(show).toHaveBeenCalledTimes(2)
  })

  it('records an agreement once and never shows the sheet again', async () => {
    const disklet = makeMemoryDisklet()
    const show = answerSheet(true)

    expect(await showSwapSendWarningModal(disklet, 'Houdini')).toBe(false)
    expect(await isRecorded(disklet)).toBe(true)

    expect(await showSwapSendWarningModal(disklet, 'Houdini')).toBe(false)
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('shares one sheet between overlapping calls, and only its own caller declines', async () => {
    const disklet = makeMemoryDisklet()
    let answer: (agree: boolean) => void = () => {}
    const show = jest.spyOn(Airship, 'show').mockImplementation(
      async () =>
        await new Promise<boolean>(resolve => {
          answer = resolve
        })
    )

    const first = showSwapSendWarningModal(disklet, 'Houdini')
    const second = showSwapSendWarningModal(disklet, 'Houdini')
    // Both calls read the disklet before either reaches the sheet:
    for (let tick = 0; tick < 10; ++tick) await Promise.resolve()
    expect(show).toHaveBeenCalledTimes(1)

    answer(false)
    expect(await first).toBe(true)
    expect(await second).toBe(false)
    expect(await isRecorded(disklet)).toBe(false)

    // The finished sheet no longer swallows the next call:
    answerSheet(true)
    expect(await showSwapSendWarningModal(disklet, 'Houdini')).toBe(false)
    expect(show).toHaveBeenCalledTimes(2)
    expect(await isRecorded(disklet)).toBe(true)
  })
})
