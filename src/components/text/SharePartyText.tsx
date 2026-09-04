import * as React from 'react'
import { Text } from 'react-native'

import { lstrings } from '../../locales/strings'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'

interface Props {
  /**
   * A sprintf template with a single `%1$s`, which the name replaces.
   */
  template: string
  /** The other party's nickname. */
  name: string
  /** Used when the other party gave no name. */
  fallbackTemplate?: string
}

/**
 * A sentence naming the other party, with their nickname in bold so it stands
 * apart from the surrounding words.
 *
 * This returns loose text, so it must be rendered inside a `Text` — a
 * `ModalTitle` when it is a modal's title. Android throws "Text strings must
 * be rendered within a <Text> component" if it lands directly in a `View`.
 *
 * When the name is missing and there is no fallback wording, the name reads as
 * a generic stand-in rather than leaving a hole in the sentence.
 */
export const SharePartyText: React.FC<Props> = props => {
  const { template, name, fallbackTemplate } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  if (name === '' && fallbackTemplate != null) return <>{fallbackTemplate}</>

  const shown = name === '' ? lstrings.wallet_share_history_anonymous : name
  // Split on the placeholder itself, so the surrounding words survive intact
  // however a translation orders them:
  const [before = '', after = ''] = template.split('%1$s')

  return (
    <>
      {before}
      <Text style={styles.name}>{shown}</Text>
      {after}
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  name: {
    fontFamily: theme.fontFaceBold
  }
}))
