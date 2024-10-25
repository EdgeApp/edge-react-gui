/**
 * Recursively adds metadata to a context object.
 *
 * @param context The context object to which to add metadata
 * @param metadata The metadata object to add to the context
 * @param prefixKeys optional prefix keys to add to each entry
 * @returns void (modifies context object)
 */
export function addMetadataToContext(context: Record<string, unknown>, metadata: object, prefixKeys: string[] = []): void {
  for (const [key, value] of Object.entries(metadata)) {
    const allKeys = [...prefixKeys, key]
    const fullKey = allKeys.join(' > ')

    // Serialize error objects manually because JSON.stringify doesn't
    // include all the error properties:
    if (value instanceof Error) {
      context[fullKey] = `${value.name}: ${value.message}`
      if (value.stack != null) {
        // Include the stack trace with indentation:
        context[fullKey] += `\n    ${value.stack.replace(/\n/g, '\n    ')}`
      }
      continue
    }

    // Recurse over objects with added prefix keys:
    if (typeof value === 'object' && value !== null) {
      addMetadataToContext(context, value, allKeys)
      continue
    }

    // Default
    context[key] = value
  }
}
