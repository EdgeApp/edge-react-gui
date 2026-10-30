#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

// Get the root directory
const rootDir = path.resolve(__dirname, '..')
const eslintConfigPath = path.join(rootDir, 'eslint.config.mjs')

// Concluding one of these operations fires pre-commit with a staged set that
// is not this commit's own edits: a merge stages the whole incoming delta, and
// a cherry-pick or revert replays a commit whose list changes it already carries
const inProgressOperations: Array<[string, string]> = [
  ['MERGE_HEAD', 'merge'],
  ['CHERRY_PICK_HEAD', 'cherry-pick'],
  ['REVERT_HEAD', 'revert']
]

// Get the merge, cherry-pick, or revert in progress, if any.
// Asking git keeps this correct inside a worktree, where .git is a file.
function getInProgressOperation(): string | undefined {
  for (const [ref, operation] of inProgressOperations) {
    try {
      execSync(`git rev-parse -q --verify ${ref}`, { stdio: 'ignore' })
      return operation
    } catch {
      // The ref is missing, so this operation is not in progress
    }
  }
  return undefined
}

// Get list of staged files
function getStagedFiles(): string[] {
  try {
    const output = execSync(
      'git diff --cached --name-only --diff-filter=ACMR',
      { encoding: 'utf8' }
    )
    return output
      .trim()
      .split('\n')
      .filter(file => file.length > 0)
  } catch (error) {
    console.error('Error getting staged files:', error)
    return []
  }
}

// Remove staged files from the warnings list
function removeStagedFilesFromWarningsList(): void {
  const stagedFiles = getStagedFiles()
  if (stagedFiles.length === 0) {
    console.log('No staged files to process')
    return
  }

  console.log('Processing staged files:', stagedFiles.length)

  // Read the config file
  let configContent = fs.readFileSync(eslintConfigPath, 'utf8')

  // Track what was removed
  let removedCount = 0
  const removedFiles: string[] = []

  // Process each staged file
  for (const stagedFile of stagedFiles) {
    // Create regex to match the file in the array with surrounding quotes and possible comma
    // This handles files with quotes like 'file.ts' or "file.ts"
    const patterns = [
      new RegExp(
        `^(\\s*)(['"])${stagedFile.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )}\\2,?\\s*$`,
        'gm'
      ),
      new RegExp(
        `^(\\s*)(['"])${stagedFile.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&'
        )}\\2,?\\s*\n`,
        'gm'
      )
    ]

    for (const pattern of patterns) {
      const matches = configContent.match(pattern)
      if (matches != null) {
        configContent = configContent.replace(pattern, '')
        removedFiles.push(stagedFile)
        removedCount++
        break
      }
    }
  }

  if (removedCount > 0) {
    // Clean up any double newlines that might have been created
    configContent = configContent.replace(/\n\s*\n\s*\n/g, '\n\n')

    // Fix any trailing commas before the closing bracket
    configContent = configContent.replace(/,(\s*\])/g, '$1')

    // Write the updated config
    fs.writeFileSync(eslintConfigPath, configContent, 'utf8')

    // Stage the updated ESLint config
    try {
      execSync(`git add ${eslintConfigPath}`)
      console.log(
        `\nRemoved ${removedCount} file(s) from ESLint warnings list:`
      )
      removedFiles.forEach(file => {
        console.log(`  - ${file}`)
      })
      console.log('\nUpdated eslint.config.mjs has been staged')
    } catch (error) {
      console.error('Error staging ESLint config:', error)
      process.exit(1)
    }
  } else {
    console.log('No staged files found in the ESLint warnings list')
  }
}

// Main execution
try {
  const operation = getInProgressOperation()
  if (operation != null) {
    console.log(
      `Skipping ESLint warnings list update: a ${operation} is in progress`
    )
  } else {
    removeStagedFilesFromWarningsList()
  }
} catch (error) {
  console.error('Error:', error)
  process.exit(1)
}
