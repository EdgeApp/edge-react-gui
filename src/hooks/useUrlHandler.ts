import { showError } from '../components/services/AirshipInstance'
import { openBrowserUri } from '../util/WebUtils'

export const useUrlHandler = (url: string): (() => void) => {
  return () => {
    openBrowserUri(url).catch((error: unknown) => {
      showError(error)
    })
  }
}
