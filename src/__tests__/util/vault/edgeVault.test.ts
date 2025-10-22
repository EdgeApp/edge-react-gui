import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import type { Disklet } from 'disklet'
import { makeMemoryDisklet, navigateDisklet } from 'disklet'

import type { EdgeVault, EdgeVaultConfig } from '../../../util/vault/edgeVault'
import { makeEdgeVault } from '../../../util/vault/edgeVault'
import { EDGE_VAULT_NAMESPACE } from '../../../util/vault/edgeVaultKeys'
import type { EdgeVaultLogger } from '../../../util/vault/edgeVaultLogger'
import type {
  VaultAddressInfo,
  VaultBankAccountInfo,
  VaultNameField,
  VaultPersonalInfo,
  VaultRecord
} from '../../../util/vault/edgeVaultTypes'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

let mockDisklet: Disklet
let vaultDisklet: Disklet
let mockLogger: EdgeVaultLogger
let vault: EdgeVault

const createMockDisklet = (baseDisklet: Disklet): Disklet => {
  return {
    ...baseDisklet,
    setText: jest.fn(baseDisklet.setText.bind(baseDisklet)) as any,
    getText: jest.fn(baseDisklet.getText.bind(baseDisklet)) as any,
    delete: jest.fn(baseDisklet.delete.bind(baseDisklet)) as any,
    list: jest.fn(baseDisklet.list.bind(baseDisklet)) as any
  }
}

jest.mock('../../../util/rnUtils', () => ({
  makeUuid: jest.fn()
}))

describe('EdgeVault', () => {
  beforeEach(() => {
    const { makeUuid } = require('../../../util/rnUtils')
    makeUuid.mockImplementation(async () => {
      // Generate a pseudo-random UUID v4-like string
      // Example: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
        /[xy]/g,
        c => {
          const r = (Math.random() * 16) | 0
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        }
      )
      return uuid
    })
    makeUuid.mockClear()

    const baseDisklet = makeMemoryDisklet()
    mockDisklet = createMockDisklet(baseDisklet)
    vaultDisklet = navigateDisklet(mockDisklet, EDGE_VAULT_NAMESPACE)

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }

    const config: EdgeVaultConfig = {
      disklet: mockDisklet,
      logger: mockLogger
    }

    vault = makeEdgeVault(config)
  })

  describe('createPersonalInfo', () => {
    it('should create a new personal info record and return UUID', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      expect(uuid).toMatch(UUID_REGEX)
      expect(typeof uuid).toBe('string')
    })

    it('should allow creating multiple personal info records', async () => {
      const uuid1 = await vault.createPersonalInfo(samplePersonalInfo)
      const uuid2 = await vault.createPersonalInfo(samplePersonalInfo2)
      expect(uuid1).toMatch(UUID_REGEX)
      expect(uuid2).toMatch(UUID_REGEX)
    })

    it('should log successful creation', async () => {
      await vault.createPersonalInfo(samplePersonalInfo)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Created personalInfo record',
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX)
        })
      )
    })

    it('should throw and log error on disklet failure', async () => {
      jest
        .mocked(mockDisklet.setText)
        .mockRejectedValueOnce(new Error('Disklet error'))
      await expect(
        vault.createPersonalInfo(samplePersonalInfo)
      ).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create personalInfo record',
        expect.objectContaining({ error: expect.any(Error) })
      )
    })
  })

  describe('updatePersonalInfo', () => {
    it('should update an existing personal info record', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      await expect(
        vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      ).resolves.not.toThrow()
    })

    it('should log successful update', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      await vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Updated personalInfo record',
        expect.objectContaining({ id: uuid })
      )
    })

    it('should throw and log error if record does not exist', async () => {
      await expect(
        vault.updatePersonalInfo('non-existent-uuid', samplePersonalInfo)
      ).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update personalInfo record',
        expect.objectContaining({
          error: expect.any(Error),
          uuid: 'non-existent-uuid'
        })
      )
    })

    it('should throw and log error on disklet failure', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      jest
        .mocked(mockDisklet.setText)
        .mockRejectedValueOnce(new Error('Disklet error'))
      await expect(
        vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      ).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update personalInfo record',
        expect.anything()
      )
    })
  })

  describe('createAddressInfo', () => {
    it('should create a new address info record and return UUID', async () => {
      const uuid = await vault.createAddressInfo(sampleAddressInfo)
      expect(uuid).toMatch(UUID_REGEX)
      expect(typeof uuid).toBe('string')
    })

    it('should handle optional line2 field', async () => {
      const uuid = await vault.createAddressInfo(sampleAddressInfoNoLine2)
      expect(uuid).toBeTruthy()
    })

    it('should allow creating multiple address info records', async () => {
      const uuid1 = await vault.createAddressInfo(sampleAddressInfo)
      const uuid2 = await vault.createAddressInfo(sampleAddressInfoNoLine2)
      expect(uuid1).toMatch(UUID_REGEX)
      expect(uuid2).toMatch(UUID_REGEX)
    })

    it('should log successful creation', async () => {
      await vault.createAddressInfo(sampleAddressInfo)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Created addressInfo record',
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX)
        })
      )
    })
  })

  describe('updateAddressInfo', () => {
    it('should update an existing address info record', async () => {
      const uuid = await vault.createAddressInfo(sampleAddressInfo)
      await expect(
        vault.updateAddressInfo(uuid, sampleAddressInfoNoLine2)
      ).resolves.not.toThrow()
    })

    it('should log successful update', async () => {
      const uuid = await vault.createAddressInfo(sampleAddressInfo)
      await vault.updateAddressInfo(uuid, sampleAddressInfoNoLine2)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Updated addressInfo record',
        expect.objectContaining({ id: uuid })
      )
    })

    it('should throw and log error if record does not exist', async () => {
      await expect(
        vault.updateAddressInfo('non-existent-uuid', sampleAddressInfo)
      ).rejects.toThrow()
    })
  })

  describe('createBankAccountInfo', () => {
    it('should create a new bank account info record and return UUID', async () => {
      const uuid = await vault.createBankAccountInfo(sampleBankAccountInfo)
      expect(uuid).toMatch(UUID_REGEX)
      expect(typeof uuid).toBe('string')
    })

    it('should allow creating multiple bank account info records', async () => {
      const uuid1 = await vault.createBankAccountInfo(sampleBankAccountInfo)
      const uuid2 = await vault.createBankAccountInfo(sampleBankAccountInfo2)
      expect(uuid1).toMatch(UUID_REGEX)
      expect(uuid2).toMatch(UUID_REGEX)
    })

    it('should log successful creation', async () => {
      await vault.createBankAccountInfo(sampleBankAccountInfo)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Created bankAccountInfo record',
        expect.objectContaining({
          id: expect.stringMatching(UUID_REGEX)
        })
      )
    })
  })

  describe('updateBankAccountInfo', () => {
    it('should update an existing bank account info record', async () => {
      const uuid = await vault.createBankAccountInfo(sampleBankAccountInfo)
      await expect(
        vault.updateBankAccountInfo(uuid, sampleBankAccountInfo2)
      ).resolves.not.toThrow()
    })

    it('should log successful update', async () => {
      const uuid = await vault.createBankAccountInfo(sampleBankAccountInfo)
      await vault.updateBankAccountInfo(uuid, sampleBankAccountInfo2)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Updated bankAccountInfo record',
        expect.objectContaining({ id: uuid })
      )
    })

    it('should throw and log error if record does not exist', async () => {
      await expect(
        vault.updateBankAccountInfo('non-existent-uuid', sampleBankAccountInfo)
      ).rejects.toThrow()
    })
  })

  describe('getUuid', () => {
    it('should return UUID at index 0 for personalInfo', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      const retrievedUuid = await vault.getUuid('personalInfo', 0)
      expect(retrievedUuid).toBe(uuid)
    })

    it('should return UUID at index 0 for addressInfo', async () => {
      const uuid = await vault.createAddressInfo(sampleAddressInfo)
      const retrievedUuid = await vault.getUuid('addressInfo', 0)
      expect(retrievedUuid).toBe(uuid)
    })

    it('should return UUID at index 0 for bankAccountInfo', async () => {
      const uuid = await vault.createBankAccountInfo(sampleBankAccountInfo)
      const retrievedUuid = await vault.getUuid('bankAccountInfo', 0)
      expect(retrievedUuid).toBe(uuid)
    })

    it('should return UUID at arbitrary index positions', async () => {
      const uuid1 = await vault.createPersonalInfo(samplePersonalInfo)
      const uuid2 = await vault.createPersonalInfo(samplePersonalInfo2)
      const retrievedUuid0 = await vault.getUuid('personalInfo', 0)
      const retrievedUuid1 = await vault.getUuid('personalInfo', 1)
      expect(retrievedUuid0).toBe(uuid1)
      expect(retrievedUuid1).toBe(uuid2)
    })

    it('should return null if index is out of bounds', async () => {
      await vault.createPersonalInfo(samplePersonalInfo)
      const retrievedUuid = await vault.getUuid('personalInfo', 10)
      expect(retrievedUuid).toBeNull()
    })

    it('should return null if array is empty', async () => {
      const retrievedUuid = await vault.getUuid('personalInfo', 0)
      expect(retrievedUuid).toBeNull()
    })

    it('should return null for negative indices', async () => {
      await vault.createPersonalInfo(samplePersonalInfo)
      const retrievedUuid = await vault.getUuid('personalInfo', -1)
      expect(retrievedUuid).toBeNull()
    })
  })

  describe('integration tests', () => {
    it('should handle complete create → read → update cycle', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      const retrievedUuid = await vault.getUuid('personalInfo', 0)
      expect(retrievedUuid).toBe(uuid)
      await expect(
        vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      ).resolves.not.toThrow()
    })

    it('should maintain multiple records of same type', async () => {
      const uuid1 = await vault.createPersonalInfo(samplePersonalInfo)
      const uuid2 = await vault.createPersonalInfo(samplePersonalInfo2)

      const retrievedUuid1 = await vault.getUuid('personalInfo', 0)
      const retrievedUuid2 = await vault.getUuid('personalInfo', 1)

      expect(retrievedUuid1).toBe(uuid1)
      expect(retrievedUuid2).toBe(uuid2)
    })

    it('should maintain different record types independently', async () => {
      const uuid1 = await vault.createPersonalInfo(samplePersonalInfo)
      const uuid2 = await vault.createAddressInfo(sampleAddressInfo)
      const uuid3 = await vault.createBankAccountInfo(sampleBankAccountInfo)

      expect(await vault.getUuid('personalInfo', 0)).toBe(uuid1)
      expect(await vault.getUuid('addressInfo', 0)).toBe(uuid2)
      expect(await vault.getUuid('bankAccountInfo', 0)).toBe(uuid3)
    })

    it('should handle interleaved creates and updates', async () => {
      const uuid1 = await vault.createPersonalInfo(samplePersonalInfo)
      const uuid2 = await vault.createAddressInfo(sampleAddressInfo)

      await vault.updatePersonalInfo(uuid1, samplePersonalInfo2)

      const uuid3 = await vault.createBankAccountInfo(sampleBankAccountInfo)

      await vault.updateAddressInfo(uuid2, sampleAddressInfoNoLine2)

      expect(await vault.getUuid('personalInfo', 0)).toBe(uuid1)
      expect(await vault.getUuid('addressInfo', 0)).toBe(uuid2)
      expect(await vault.getUuid('bankAccountInfo', 0)).toBe(uuid3)
    })

    it('should maintain index consistency after updates', async () => {
      const uuid1 = await vault.createPersonalInfo(samplePersonalInfo)
      const uuid2 = await vault.createPersonalInfo(samplePersonalInfo2)

      await vault.updatePersonalInfo(uuid1, {
        ...samplePersonalInfo,
        name: { ...samplePersonalInfo.name, firstName: 'Updated' }
      })

      expect(await vault.getUuid('personalInfo', 0)).toBe(uuid1)
      expect(await vault.getUuid('personalInfo', 1)).toBe(uuid2)
    })
  })

  describe('error handling', () => {
    it('should throw on disklet list failures when getting uuids', async () => {
      jest
        .mocked(mockDisklet.list)
        .mockRejectedValueOnce(new Error('Disklet list error'))
      await expect(vault.getUuid('personalInfo', 0)).rejects.toThrow(
        'Disklet list error'
      )
    })

    it('should handle disklet write failures with proper errors', async () => {
      jest
        .mocked(mockDisklet.setText)
        .mockRejectedValueOnce(new Error('Disklet write error'))
      await expect(
        vault.createPersonalInfo(samplePersonalInfo)
      ).rejects.toThrow()
    })

    it('should handle invalid UUIDs in update operations', async () => {
      await expect(
        vault.updatePersonalInfo('invalid-uuid', samplePersonalInfo)
      ).rejects.toThrow()
    })

    it('should log all errors appropriately', async () => {
      jest
        .mocked(mockDisklet.setText)
        .mockRejectedValueOnce(new Error('Disklet write error'))
      await expect(
        vault.createPersonalInfo(samplePersonalInfo)
      ).rejects.toThrow()
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle very long strings in text fields', async () => {
      const longString = 'a'.repeat(10000)
      const info: VaultPersonalInfo = {
        type: 'personalInfo',
        email: 'test@example.com',
        name: {
          firstName: longString,
          lastName: 'Test'
        }
      }

      const uuid = await vault.createPersonalInfo(info)
      expect(uuid).toBeTruthy()
    })

    it('should handle special characters in text fields', async () => {
      const info: VaultPersonalInfo = {
        type: 'personalInfo',
        email: 'test+tag@example.com',
        name: {
          firstName: 'José',
          lastName: "O'Brien-Smith"
        }
      }

      const uuid = await vault.createPersonalInfo(info)
      expect(uuid).toBeTruthy()
    })

    it('should handle empty strings where allowed', async () => {
      const info: VaultAddressInfo = {
        type: 'addressInfo',
        line1: '',
        city: '',
        state: '',
        postalCode: '',
        countryCode: ''
      }
      const uuid = await vault.createAddressInfo(info)
      expect(uuid).toBeTruthy()
    })

    it('should handle updating with same data', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)
      await expect(
        vault.updatePersonalInfo(uuid, samplePersonalInfo)
      ).resolves.not.toThrow()
    })

    it('should handle large number of records', async () => {
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(vault.createPersonalInfo(samplePersonalInfo))
      }
      const uuids = await Promise.all(promises)
      expect(uuids).toHaveLength(100)
      expect(new Set(uuids).size).toBe(100)

      const firstUuid = await vault.getUuid('personalInfo', 0)
      const lastUuid = await vault.getUuid('personalInfo', 99)

      expect(firstUuid).not.toBeNull()
      expect(lastUuid).not.toBeNull()
      expect(uuids).toContain(firstUuid)
      expect(uuids).toContain(lastUuid)
    })
  })

  describe('file system cleanup and atomicity', () => {
    it('should not create duplicate files for same UUID on update', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)

      const filesBefore = await vaultDisklet.list('personalInfo/')
      const filesBeforeCount = Object.keys(filesBefore).length

      await vault.updatePersonalInfo(uuid, samplePersonalInfo2)

      const filesAfter = await vaultDisklet.list('personalInfo/')
      const filesAfterCount = Object.keys(filesAfter).length

      expect(filesAfterCount).toBe(filesBeforeCount)
      expect(filesAfterCount).toBe(1)
    })

    it('should overwrite file at index 0 without creating new file (InfiniteRAMP use case)', async () => {
      // InfiniteRAMP plugin pattern: create once, then always update record at index 0
      // This ensures only one record exists and gets updated in place
      await vault.createPersonalInfo(samplePersonalInfo)

      const uuid0 = await vault.getUuid('personalInfo', 0)
      expect(uuid0).not.toBeNull()

      const filesBefore = await vaultDisklet.list('personalInfo/')
      const filesBeforeCount = Object.keys(filesBefore).length
      expect(filesBeforeCount).toBe(1)

      // Update the record at index 0 - should overwrite, not create new file
      await vault.updatePersonalInfo(uuid0!, samplePersonalInfo2)

      const filesAfter = await vaultDisklet.list('personalInfo/')
      const filesAfterCount = Object.keys(filesAfter).length
      expect(filesAfterCount).toBe(1)

      // UUID at index 0 should remain the same
      const uuid0After = await vault.getUuid('personalInfo', 0)
      expect(uuid0After).toBe(uuid0)
    })

    it('should handle setText failures during create', async () => {
      const baseDisklet = makeMemoryDisklet()
      const testMockDisklet = createMockDisklet(baseDisklet)

      jest
        .mocked(testMockDisklet.setText)
        .mockRejectedValueOnce(new Error('Write failed'))

      const testVault = makeEdgeVault({
        disklet: testMockDisklet,
        logger: mockLogger
      })

      await expect(
        testVault.createPersonalInfo(samplePersonalInfo)
      ).rejects.toThrow('Write failed')
    })

    it('should handle directory listing during getUuid', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)

      await expect(
        vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      ).resolves.not.toThrow()

      const retrievedUuid = await vault.getUuid('personalInfo', 0)
      expect(retrievedUuid).toBe(uuid)
    })

    it('should not create duplicate files under concurrent creates', async () => {
      const promises = Array(10)
        .fill(null)
        .map(async () => await vault.createPersonalInfo(samplePersonalInfo))

      const uuids = await Promise.all(promises)

      const files = await vaultDisklet.list('personalInfo/')
      expect(Object.keys(files).length).toBe(10)
      expect(uuids.length).toBe(10)
      expect(new Set(uuids).size).toBe(10)
    })

    it('should maintain file count consistency across record types', async () => {
      await vault.createPersonalInfo(samplePersonalInfo)
      await vault.createPersonalInfo(samplePersonalInfo2)
      await vault.createAddressInfo(sampleAddressInfo)
      await vault.createBankAccountInfo(sampleBankAccountInfo)

      const personalFiles = await vaultDisklet.list('personalInfo/')
      const addressFiles = await vaultDisklet.list('addressInfo/')
      const bankFiles = await vaultDisklet.list('bankAccountInfo/')

      expect(Object.keys(personalFiles).length).toBe(2)
      expect(Object.keys(addressFiles).length).toBe(1)
      expect(Object.keys(bankFiles).length).toBe(1)
    })

    it('should not accumulate files after multiple updates', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)

      const filesAfterCreate = await vaultDisklet.list('personalInfo/')
      const initialCount = Object.keys(filesAfterCreate).length

      for (let i = 0; i < 5; i++) {
        await vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      }

      const filesAfterUpdates = await vaultDisklet.list('personalInfo/')
      expect(Object.keys(filesAfterUpdates).length).toBe(initialCount)
      expect(Object.keys(filesAfterUpdates).length).toBe(1)
    })

    it('should handle record write failures during update', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)

      jest
        .mocked(mockDisklet.setText)
        .mockRejectedValueOnce(new Error('Record write failed'))

      await expect(
        vault.updatePersonalInfo(uuid, samplePersonalInfo2)
      ).rejects.toThrow('Record write failed')
    })

    it('should handle concurrent updates to same record', async () => {
      const uuid = await vault.createPersonalInfo(samplePersonalInfo)

      const updates = Array(5)
        .fill(null)
        .map(async (_, i) => {
          await vault.updatePersonalInfo(uuid, {
            ...samplePersonalInfo2,
            name: {
              ...samplePersonalInfo2.name,
              firstName: `Update${i}`
            }
          })
        })

      await Promise.all(updates)

      const files = await vaultDisklet.list('personalInfo/')
      expect(Object.keys(files).length).toBe(1)

      const retrievedUuid = await vault.getUuid('personalInfo', 0)
      expect(retrievedUuid).toBe(uuid)
    })

    it('should organize records by type in separate directories', async () => {
      await vault.createPersonalInfo(samplePersonalInfo)
      await vault.createAddressInfo(sampleAddressInfo)
      await vault.createBankAccountInfo(sampleBankAccountInfo)

      const rootFiles = await vaultDisklet.list('')
      const directories = Object.keys(rootFiles).filter(
        key => rootFiles[key] === 'folder'
      )

      expect(directories).toContain('personalInfo')
      expect(directories).toContain('addressInfo')
      expect(directories).toContain('bankAccountInfo')
    })
  })
})

const samplePersonalInfo: VaultPersonalInfo = {
  type: 'personalInfo',
  email: 'john.doe@example.com',
  name: {
    firstName: 'John',
    lastName: 'Doe'
  }
}

export const samplePersonalInfo2: VaultPersonalInfo = {
  type: 'personalInfo',
  email: 'jane.smith@example.com',
  name: {
    firstName: 'Jane',
    lastName: 'Smith'
  }
}

export const sampleAddressInfo: VaultAddressInfo = {
  type: 'addressInfo',
  line1: '123 Main St',
  line2: 'Apt 4B',
  city: 'San Francisco',
  state: 'CA',
  postalCode: '94102',
  countryCode: 'US'
}

export const sampleAddressInfoNoLine2: VaultAddressInfo = {
  type: 'addressInfo',
  line1: '456 Oak Ave',
  city: 'Portland',
  state: 'OR',
  postalCode: '97201',
  countryCode: 'US'
}

const cloneVaultName = (name: VaultNameField): VaultNameField => ({
  firstName: name.firstName,
  middleName: name.middleName,
  lastName: name.lastName
})

export const sampleBankAccountInfo: VaultBankAccountInfo = {
  type: 'bankAccountInfo',
  bankName: 'Test Bank',
  accountName: 'Checking',
  ownerName: cloneVaultName(samplePersonalInfo.name),
  accountNumber: '1234567890',
  routingNumber: '987654321'
}

export const sampleBankAccountInfo2: VaultBankAccountInfo = {
  type: 'bankAccountInfo',
  bankName: 'Second Bank',
  accountName: 'Savings',
  ownerName: cloneVaultName(samplePersonalInfo2.name),
  accountNumber: '0987654321',
  routingNumber: '123456789'
}

export const createSamplePersonalRecord = (
  recordId: string = 'test-uuid-1'
): VaultRecord<VaultPersonalInfo> => ({
  recordId,
  metadata: {
    version: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  data: samplePersonalInfo
})

export const createSampleAddressRecord = (
  recordId: string = 'test-uuid-2'
): VaultRecord<VaultAddressInfo> => ({
  recordId,
  metadata: {
    version: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  data: sampleAddressInfo
})

export const createSampleBankAccountRecord = (
  recordId: string = 'test-uuid-3'
): VaultRecord<VaultBankAccountInfo> => ({
  recordId,
  metadata: {
    version: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  data: sampleBankAccountInfo
})
