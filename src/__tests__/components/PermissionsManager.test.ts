import { beforeEach, describe, expect, it, type jest } from '@jest/globals'
import {
  check,
  openSettings,
  type PermissionStatus,
  request
} from 'react-native-permissions'

import { requestContactsPermission } from '../../components/services/PermissionsManager'

const mockCheck = check as jest.MockedFunction<typeof check>
const mockRequest = request as jest.MockedFunction<typeof request>
const mockOpenSettings = openSettings as jest.MockedFunction<
  typeof openSettings
>

/**
 * Makes `check` report `before` until `request` runs, then `after`,
 * like the OS does once the user answers the prompt.
 */
function givenStatuses(
  before: PermissionStatus,
  answer: PermissionStatus,
  after: PermissionStatus = answer
): void {
  let answered = false
  mockCheck.mockImplementation(async () => (answered ? after : before))
  mockRequest.mockImplementation(async () => {
    answered = true
    return answer
  })
}

describe('requestContactsPermission', () => {
  beforeEach(() => {
    mockCheck.mockReset()
    mockRequest.mockReset()
    mockOpenSettings.mockReset()
    mockOpenSettings.mockImplementation(async () => {})
  })

  it('stays in the app when the user declines the first prompt', async () => {
    givenStatuses('denied', 'blocked')

    const granted = await requestContactsPermission(true)

    expect(granted).toBe(false)
    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(mockOpenSettings).not.toHaveBeenCalled()
  })

  it('returns granted when the user allows the prompt', async () => {
    givenStatuses('denied', 'granted')

    const granted = await requestContactsPermission(true)

    expect(granted).toBe(true)
    expect(mockOpenSettings).not.toHaveBeenCalled()
  })

  it('opens settings when access was already blocked', async () => {
    givenStatuses('blocked', 'blocked')

    const granted = await requestContactsPermission(true)

    expect(granted).toBe(false)
    expect(mockOpenSettings).toHaveBeenCalledTimes(1)
  })

  it('opens settings to turn granted access off', async () => {
    givenStatuses('granted', 'granted')

    await requestContactsPermission(false)

    expect(mockRequest).not.toHaveBeenCalled()
    expect(mockOpenSettings).toHaveBeenCalledTimes(1)
  })
})
