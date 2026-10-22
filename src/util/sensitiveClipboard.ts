import Clipboard from '@react-native-clipboard/clipboard'
import { NativeModules } from 'react-native'

interface EdgeClipboardNative {
  setSensitiveString: (text: string, expirySeconds: number) => Promise<void>
}

/**
 * How long a copied secret stays on the clipboard.
 *
 * The `fragment_wallets_copied_seed_clears` toast says "1 minute", so that
 * string has to change along with this value.
 */
export const SENSITIVE_CLIPBOARD_SECONDS = 60

let fallbackTimer: ReturnType<typeof setTimeout> | undefined

function getNativeModule(): EdgeClipboardNative | undefined {
  const module = NativeModules.EdgeClipboard
  if (module == null || typeof module.setSensitiveString !== 'function') {
    return undefined
  }
  return module
}

/**
 * Copies a secret, such as a seed phrase, to the clipboard and has it removed
 * after `SENSITIVE_CLIPBOARD_SECONDS`.
 *
 * The native module makes the OS do the removal, so it happens even if the
 * app is in the background or killed: iOS expires the pasteboard item and
 * keeps it off Universal Clipboard, Android flags the clip as sensitive and
 * clears it from a WorkManager job.
 *
 * A build without the native module falls back to a JS timer, which only
 * fires while the app is running.
 */
export async function copySensitiveText(text: string): Promise<void> {
  const module = getNativeModule()
  if (module != null) {
    await module.setSensitiveString(text, SENSITIVE_CLIPBOARD_SECONDS)
    return
  }

  Clipboard.setString(text)
  if (fallbackTimer != null) clearTimeout(fallbackTimer)
  fallbackTimer = setTimeout(() => {
    fallbackTimer = undefined
    Clipboard.setString('')
  }, SENSITIVE_CLIPBOARD_SECONDS * 1000)
}
