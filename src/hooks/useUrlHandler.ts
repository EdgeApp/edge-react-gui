import { openBrowserUri } from '../util/WebUtils'

export const useUrlHandler = (url: string): (() => void) => {
  return () => {
    openBrowserUri(url)
  }
}
