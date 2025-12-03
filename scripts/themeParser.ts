import fs from 'fs'

type Palette = Record<string, string>

interface ThemeOutput {
  palette: Palette
  theme: Record<string, unknown>
}

/**
 * Parse the palette object from the edgeDark.ts source file
 */
function parsePaletteFromSource(source: string): Palette {
  // Find the palette object in the source
  const paletteRegex = /const palette\s*=\s*\{([\s\S]*?)\n\}/
  const paletteMatch = paletteRegex.exec(source)
  if (paletteMatch == null) {
    throw new Error('Could not find palette object in source')
  }

  const paletteContent = paletteMatch[1]
  const palette: Palette = {}

  // Match each key-value pair in the palette
  // Handles: key: 'value' or key: "value"
  const entryRegex = /(\w+):\s*['"]([^'"]+)['"]/g
  let match

  while ((match = entryRegex.exec(paletteContent)) !== null) {
    const [, key, value] = match
    palette[key] = value
  }

  return palette
}

/**
 * Extract the theme object content from source (everything after "export const edgeDark: Theme = {")
 */
function extractThemeSource(source: string): string {
  const themeRegex =
    /export const edgeDark:\s*Theme\s*=\s*\{([\s\S]*)\}[\s\n]*$/
  const themeMatch = themeRegex.exec(source)
  if (themeMatch == null) {
    throw new Error('Could not find theme object in source')
  }
  return themeMatch[1]
}

/**
 * Parse a theme property value from source and determine if it's a runtime value.
 * Returns the parsed value if static, or null if it's a runtime value.
 *
 * Runtime values include:
 * - Function calls like scale(), Dimensions.get(), etc.
 * - Conditional expressions with Platform.OS, ternary operators
 * - Variable references that aren't palette references
 * - Import references (image imports)
 */
function parseThemeValue(
  valueStr: string,
  palette: Palette
): { isRuntime: boolean; value?: unknown } {
  const trimmed = valueStr.trim()

  // Check for function calls (scale(), rem(), etc.)
  if (/\w+\s*\(/.test(trimmed) && !trimmed.startsWith('{')) {
    return { isRuntime: true }
  }

  // Check for ternary operators or conditionals
  if (
    trimmed.includes('?') &&
    trimmed.includes(':') &&
    !trimmed.startsWith('{')
  ) {
    return { isRuntime: true }
  }

  // Check for Platform.OS or other runtime checks
  if (/Platform\.\w+/.test(trimmed) || trimmed.includes('Dimensions.')) {
    return { isRuntime: true }
  }

  // Check if it's a simple palette reference
  if (trimmed.startsWith('palette.')) {
    const paletteKey = trimmed.slice(8)
    if (palette[paletteKey] != null) {
      return { isRuntime: false, value: `palette.${paletteKey}` }
    }
  }

  // Check for string literals
  const stringMatch = /^['"]([^'"]*)['"]\s*$/.exec(trimmed)
  if (stringMatch != null) {
    // Check if the string value matches a palette entry
    const stringValue = stringMatch[1]
    const paletteKey = Object.entries(palette).find(
      ([, v]) => v === stringValue
    )?.[0]
    if (paletteKey != null) {
      return { isRuntime: false, value: `palette.${paletteKey}` }
    }
    return { isRuntime: false, value: stringValue }
  }

  // Check for number literals
  const numberMatch = /^-?\d+\.?\d*\s*$/.exec(trimmed)
  if (numberMatch != null) {
    return { isRuntime: false, value: parseFloat(trimmed) }
  }

  // Check for boolean literals
  if (trimmed === 'true') return { isRuntime: false, value: true }
  if (trimmed === 'false') return { isRuntime: false, value: false }
  if (trimmed === 'null') return { isRuntime: false, value: null }
  if (trimmed === 'undefined') return { isRuntime: false, value: undefined }

  // Check for template strings with palette references (like `${palette.xxx}00`)
  if (trimmed.startsWith('`') && trimmed.includes('${palette.')) {
    return { isRuntime: true } // These need runtime evaluation
  }

  // Check for import references (variables that aren't palette)
  // These are typically image imports
  if (/^[a-zA-Z_]\w*$/.test(trimmed) && !trimmed.startsWith('palette')) {
    return { isRuntime: true }
  }

  // For complex objects/arrays, we can't easily parse them statically
  // Return runtime to use the JSON value
  return { isRuntime: true }
}

/**
 * Build a reverse lookup map from palette values to their keys
 */
function buildPaletteLookup(palette: Palette): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const [key, value] of Object.entries(palette)) {
    lookup.set(value, key)
  }
  return lookup
}

/**
 * Check if a value matches a palette entry and return the reference string
 */
function getPaletteRef(
  value: unknown,
  paletteLookup: Map<string, string>
): string | null {
  if (typeof value !== 'string') return null
  const paletteKey = paletteLookup.get(value)
  return paletteKey != null ? `palette.${paletteKey}` : null
}

/**
 * Recursively convert theme values to use palette references where applicable.
 */
function convertToPaletteRefs(
  value: unknown,
  paletteLookup: Map<string, string>
): unknown {
  if (value == null) return value

  // Check if it's a direct palette reference
  const paletteRef = getPaletteRef(value, paletteLookup)
  if (paletteRef != null) return paletteRef

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => convertToPaletteRefs(item, paletteLookup))
  }

  // Handle objects
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertToPaletteRefs(val, paletteLookup)
    }
    return result
  }

  // Return primitive values as-is
  return value
}

/**
 * Parse theme properties from source to identify which ones are runtime values.
 * Returns a set of property names that require runtime values.
 */
function identifyRuntimeProperties(
  themeSource: string,
  palette: Palette
): Set<string> {
  const runtimeProps = new Set<string>()

  // Match top-level property assignments
  // This regex captures: propertyName: value (until the next property or end)
  const lines = themeSource.split('\n')
  let currentKey: string | null = null
  let currentValue = ''
  let braceDepth = 0
  let bracketDepth = 0

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Skip comments
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) continue

    // Check for new property start (at depth 0)
    if (braceDepth === 0 && bracketDepth === 0) {
      const propMatch = /^(\w+)\s*:\s*(.*)/.exec(trimmedLine)
      if (propMatch != null) {
        // Process previous property if exists
        if (currentKey != null && currentValue.trim() !== '') {
          const result = parseThemeValue(currentValue, palette)
          if (result.isRuntime) {
            runtimeProps.add(currentKey)
          }
        }

        currentKey = propMatch[1]
        currentValue = propMatch[2]

        // Check if value is complete on same line
        const valueWithoutTrailing = currentValue.replace(/,\s*$/, '').trim()

        // Count braces/brackets in the value
        for (const char of currentValue) {
          if (char === '{') braceDepth++
          if (char === '}') braceDepth--
          if (char === '[') bracketDepth++
          if (char === ']') bracketDepth--
        }

        // If balanced and not empty, process it
        if (
          braceDepth === 0 &&
          bracketDepth === 0 &&
          valueWithoutTrailing !== ''
        ) {
          const result = parseThemeValue(valueWithoutTrailing, palette)
          if (result.isRuntime) {
            runtimeProps.add(currentKey)
          }
          currentKey = null
          currentValue = ''
        }
        continue
      }
    }

    // Continue accumulating multi-line value
    if (currentKey != null) {
      currentValue += '\n' + trimmedLine

      for (const char of trimmedLine) {
        if (char === '{') braceDepth++
        if (char === '}') braceDepth--
        if (char === '[') bracketDepth++
        if (char === ']') bracketDepth--
      }

      // Check if we've closed all braces/brackets
      if (braceDepth === 0 && bracketDepth === 0) {
        const valueWithoutTrailing = currentValue.replace(/,\s*$/, '').trim()
        const result = parseThemeValue(valueWithoutTrailing, palette)
        if (result.isRuntime) {
          runtimeProps.add(currentKey)
        }
        currentKey = null
        currentValue = ''
      }
    }
  }

  // Process last property
  if (currentKey != null && currentValue.trim() !== '') {
    const result = parseThemeValue(currentValue, palette)
    if (result.isRuntime) {
      runtimeProps.add(currentKey)
    }
  }

  return runtimeProps
}

/**
 * Properties that should always be excluded from the theme output
 * (the rem function is a method, not a value)
 */
const EXCLUDED_PROPERTIES = new Set(['rem'])

/**
 * Process the theme object, converting palette references and handling runtime values
 */
function processTheme(
  runtimeTheme: Record<string, unknown>,
  paletteLookup: Map<string, string>,
  runtimeProperties: Set<string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(runtimeTheme)) {
    // Skip excluded properties
    if (EXCLUDED_PROPERTIES.has(key)) continue

    // For runtime properties, use the value directly from defaultTheme.json
    // but still convert any palette references within
    if (runtimeProperties.has(key)) {
      result[key] = convertToPaletteRefs(value, paletteLookup)
      continue
    }

    // Convert to palette references where applicable
    result[key] = convertToPaletteRefs(value, paletteLookup)
  }

  return result
}

/**
 * Merge the edgeDark.ts theme source with runtime values from a JSON string
 * to produce the overrideTheme.json output with palette references.
 *
 * @param themeSourceFile - JSON string containing the theme source
 * @param defaultTheme - Object containing the default theme values
 * @returns The merged theme output with { palette, theme } structure
 */
export function mergeTheme(
  themeSourceFile: string,
  defaultTheme: Record<string, unknown>
): ThemeOutput {
  console.log('Reading theme source file...')
  const source = fs.readFileSync(themeSourceFile, 'utf-8')

  console.log('Parsing palette from source...')
  const palette = parsePaletteFromSource(source)
  console.log(`Found ${Object.keys(palette).length} palette entries`)

  console.log('Extracting theme source...')
  const themeSource = extractThemeSource(source)

  console.log('Identifying runtime properties...')
  const runtimeProperties = identifyRuntimeProperties(themeSource, palette)
  console.log(
    `Found ${runtimeProperties.size} runtime properties:`,
    Array.from(runtimeProperties).join(', ')
  )

  console.log('Building palette lookup...')
  const paletteLookup = buildPaletteLookup(palette)

  console.log('Processing theme...')
  const theme = processTheme(defaultTheme, paletteLookup, runtimeProperties)

  return {
    palette,
    theme
  }
}

/**
 * Theme parser utilities for parsing override theme JSON files
 * that use the { palette, theme } format with palette references.
 */

interface OverrideThemeJson {
  palette: Palette
  theme: Record<string, unknown>
}

/**
 * Resolve a palette reference string to its actual value.
 * References are in the format "palette.keyName"
 */
function resolvePaletteRef(value: string, palette: Palette): string | null {
  if (!value.startsWith('palette.')) return null
  const key = value.slice(8) // Remove "palette." prefix
  return palette[key] ?? null
}

/**
 * Recursively resolve all palette references in a value
 */
function resolveValue(value: unknown, palette: Palette): unknown {
  if (value == null) return value

  // Handle string values - check for palette reference
  if (typeof value === 'string') {
    const resolved = resolvePaletteRef(value, palette)
    return resolved ?? value
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(item => resolveValue(item, palette))
  }

  // Handle objects
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = resolveValue(val, palette)
    }
    return result
  }

  // Return primitive values as-is (numbers, booleans, etc.)
  return value
}

/**
 * Parse an override theme JSON object and return a flat theme object
 * with all palette references fully resolved.
 *
 * @param json The override theme JSON with { palette, theme } structure
 * @returns A flat theme object equivalent to the current overrideTheme.json format
 */
export function parseOverrideTheme(
  json: OverrideThemeJson
): Record<string, unknown> {
  const { palette, theme } = json

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(theme)) {
    result[key] = resolveValue(value, palette)
  }

  return result
}
