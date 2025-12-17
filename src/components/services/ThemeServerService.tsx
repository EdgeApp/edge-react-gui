import * as React from 'react'

import { getDeviceSettings } from '../../actions/DeviceSettingsActions'
import { showError } from './AirshipInstance'
import { changeTheme, getTheme } from './ThemeContext'

const POLL_INTERVAL_MS = 3000

/**
 * Service that polls a theme server for live theme updates.
 * Enabled when themeServerUrl is set in device settings.
 */
export const ThemeServerService: React.FC = () => {
  const [url, setUrl] = React.useState<string | undefined>(
    getDeviceSettings().themeServerUrl
  )

  // Track the last JSON we applied to avoid redundant re-renders
  const themeJsonRef = React.useRef<string>('')
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Update URL when device settings change
  React.useEffect(() => {
    const checkSettings = (): void => {
      const newUrl = getDeviceSettings().themeServerUrl
      setUrl(newUrl)
    }

    // Poll device settings for changes (simple approach since DeviceSettings
    // doesn't have a watch mechanism)
    const settingsInterval = setInterval(checkSettings, 1000)
    return () => {
      clearInterval(settingsInterval)
    }
  }, [])

  React.useEffect(() => {
    // Clean up any existing interval
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (url == null || url === '') {
      // Reset theme JSON tracking when disabled
      themeJsonRef.current = ''
      return
    }

    const themeUrl = url.endsWith('/theme') ? url : `${url}/theme`

    const startThemeService = async (): Promise<void> => {
      try {
        const oldTheme = getTheme()
        console.log('THEME:\n' + JSON.stringify(oldTheme, null, 2))

        // POST current theme to seed the server
        const postOptions = {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(oldTheme)
        }
        await fetch(themeUrl, postOptions)

        const getOptions = {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'GET'
        }

        const updateTheme = async (): Promise<void> => {
          try {
            const response = await fetch(themeUrl, getOptions)
            const overrideTheme = await response.json()
            const newTheme = { ...oldTheme, ...overrideTheme }
            const newThemeJson = JSON.stringify(newTheme, null, 2)
            if (newThemeJson !== themeJsonRef.current) {
              console.log('Theme changed!')
              changeTheme(newTheme)
              themeJsonRef.current = newThemeJson
            }
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e)
            console.log(`Failed get theme`, message)
          }
        }

        // Initial theme fetch
        await updateTheme()

        // Set up polling interval
        intervalRef.current = setInterval(() => {
          updateTheme().catch((error: unknown) => {
            showError(error)
          })
        }, POLL_INTERVAL_MS)
      } catch (e: unknown) {
        console.log(`Failed to access theme server`)
      }
    }

    startThemeService().catch((err: unknown) => {
      console.error(err)
    })

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [url])

  return null
}
