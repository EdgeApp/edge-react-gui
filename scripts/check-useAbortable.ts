#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'fs'
import { extname, join } from 'path'

interface Issue {
  file: string
  line: number
  column: number
  message: string
  rule: string
}

/**
 * Recursively find all TypeScript/JavaScript files in a directory
 */
function findFiles(
  dir: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']
): string[] {
  const files: string[] = []

  function walk(currentDir: string) {
    const items = readdirSync(currentDir)

    for (const item of items) {
      const fullPath = join(currentDir, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules and other common directories
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          walk(fullPath)
        }
      } else if (stat.isFile() && extensions.includes(extname(item))) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

/**
 * Check if useAbortable calls have the required maybeAbort parameter
 */
function checkUseAbortableParam(content: string, filePath: string): Issue[] {
  const issues: Issue[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const useAbortableMatch = line.match(/useAbortable\s*\(\s*([^)]+)\s*\)/)

    if (useAbortableMatch) {
      const arrowFunctionMatch = useAbortableMatch[1].match(
        /\(\s*([^)]*)\s*\)\s*=>/
      )

      if (arrowFunctionMatch) {
        const params = arrowFunctionMatch[1].trim()
        if (!params || params.length === 0) {
          issues.push({
            file: filePath,
            line: i + 1,
            column: line.indexOf('useAbortable') + 1,
            message: 'Missing maybeAbort parameter for useAbortable hook',
            rule: 'useAbortable-abort-check-param'
          })
        }
      }
    }
  }

  return issues
}

/**
 * Check if awaited promises within useAbortable are followed by .then(maybeAbort)
 */
function checkUseAbortableUsage(content: string, filePath: string): Issue[] {
  const issues: Issue[] = []
  const lines = content.split('\n')

  let withinUseAbortable = false
  let abortParamName: string | null = null
  let braceLevel = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Track brace levels to know when we're inside useAbortable
    braceLevel += (line.match(/\{/g) || []).length
    braceLevel -= (line.match(/\}/g) || []).length

    // Check for useAbortable call
    const useAbortableMatch = line.match(/useAbortable\s*\(\s*([^)]+)\s*\)/)
    if (useAbortableMatch) {
      withinUseAbortable = true
      const arrowFunctionMatch = useAbortableMatch[1].match(
        /\(\s*([^)]*)\s*\)\s*=>/
      )

      if (arrowFunctionMatch) {
        const params = arrowFunctionMatch[1].trim()
        if (params && params.length > 0) {
          abortParamName = params.split(',')[0].trim()
        }
      }
    }

    // Check for await expressions within useAbortable
    if (withinUseAbortable && abortParamName) {
      const awaitMatch = line.match(
        /await\s+([^.]+(?:\.[^.]+)*(?:\([^)]*\))?)/g
      )

      if (awaitMatch) {
        for (const awaitExpr of awaitMatch) {
          const expression = awaitExpr.replace(/^await\s+/, '')

          // Check if it already has .then(maybeAbort)
          if (!expression.includes(`.then(${abortParamName})`)) {
            issues.push({
              file: filePath,
              line: i + 1,
              column: line.indexOf('await') + 1,
              message: `Awaited promise within useAbortable should be followed by .then(${abortParamName})`,
              rule: 'useAbortable-abort-check-usage'
            })
          }
        }
      }
    }

    // Exit useAbortable context when we've closed all braces
    if (withinUseAbortable && braceLevel === 0) {
      withinUseAbortable = false
      abortParamName = null
    }
  }

  return issues
}

/**
 * Check a single file for useAbortable issues
 */
function checkFile(filePath: string): Issue[] {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const issues: Issue[] = []

    issues.push(...checkUseAbortableParam(content, filePath))
    issues.push(...checkUseAbortableUsage(content, filePath))

    return issues
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return []
  }
}

/**
 * Main function to check all files
 */
function main() {
  const srcDir = 'src'
  const files = findFiles(srcDir)

  console.log(`Checking ${files.length} files for useAbortable issues...`)

  let totalIssues = 0

  for (const file of files) {
    const issues = checkFile(file)

    if (issues.length > 0) {
      console.log(`\n${file}:`)
      for (const issue of issues) {
        console.log(
          `  ${issue.line}:${issue.column} ${issue.rule} - ${issue.message}`
        )
        totalIssues++
      }
    }
  }

  if (totalIssues === 0) {
    console.log('\n✅ No useAbortable issues found!')
  } else {
    console.log(`\n❌ Found ${totalIssues} useAbortable issues`)
    process.exit(1)
  }
}

// Run the checker
main()
