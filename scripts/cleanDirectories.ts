import * as fs from 'fs'
import * as path from 'path'

// Validate directory names (YYMMDDxx or YYYY-MM-DD)
const isValidDirName = (dirName: string): boolean => /^[0-9]{8}$/.test(dirName) || /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dirName)

// Parse date from directory name
const parseDateFromDirName = (dirName: string): Date | null => {
  let year, month, day

  if (/^[0-9]{8}$/.test(dirName)) {
    // Handle YYMMDDxx
    year = parseInt(dirName.slice(0, 2), 10)
    month = parseInt(dirName.slice(2, 4), 10) - 1 // JS months are 0-indexed
    day = parseInt(dirName.slice(4, 6), 10)
    year = 2000 + year // Adjust YY to YYYY
  } else if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dirName)) {
    // Handle YYYY-MM-DD
    const parts = dirName.split('-')
    year = parseInt(parts[0], 10)
    month = parseInt(parts[1], 10) - 1
    day = parseInt(parts[2], 10)
  } else {
    return null // Invalid format
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null
  }

  return new Date(year, month, day)
}

// Pure function: find old directories
export const findOldDirs = (dirNames: string[], cutoffDate: Date): string[] =>
  dirNames.filter(dirName => {
    if (!isValidDirName(dirName)) return false

    const dirDate = parseDateFromDirName(dirName)
    return dirDate !== null && dirDate < cutoffDate
  })

// Reads all directories in a given path (synchronously)
const getAllDirNamesSync = (basePath: string): string[] => {
  const entries = fs.readdirSync(basePath, { withFileTypes: true })
  return entries.filter(entry => entry.isDirectory()).map(entry => entry.name)
}

// Main function to delete old directories (synchronously)
export const deleteOldDirsSync = (basePath: string, cutoffDate: Date): void => {
  try {
    const dirNames = getAllDirNamesSync(basePath)
    const oldDirs = findOldDirs(dirNames, cutoffDate)

    oldDirs.forEach(dirName => {
      const fullPath = path.join(basePath, dirName)
      try {
        fs.rmSync(fullPath, { recursive: true, force: true })
        console.log(`Deleted directory: ${dirName}`)
      } catch (err) {
        console.error(`Failed to delete ${dirName}:`, err)
      }
    })
  } catch (err) {
    console.error('Error:', err)
  }
}
