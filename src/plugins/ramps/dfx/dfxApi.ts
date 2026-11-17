export const DFX_API_URL = 'https://api.dfx.swiss/v1'

/**
 * Fetches a DFX API path and returns the response text. Throws an error
 * naming the path, status and DFX's answer when the request fails.
 */
export async function fetchDfx(
  path: string,
  init?: RequestInit
): Promise<string> {
  const response = await fetch(`${DFX_API_URL}${path}`, init)
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `${path.split('?')[0]} returned ${response.status}: ${text}`
    )
  }
  return text
}
