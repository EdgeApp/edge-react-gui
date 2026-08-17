import * as React from 'react'
import { View } from 'react-native'

import { STEALTH_LEARN_MORE_URI } from '../../constants/stealthConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { openBrowserUri } from '../../util/WebUtils'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

interface Props {
  /** What the line says: the explanation, or why the toggle cannot be armed. */
  message: string
  /**
   * Whether to offer the "Learn more" link. A blocked-reason line does not:
   * the article explains the feature, not why this particular send is
   * ineligible.
   */
  showLearnMore?: boolean
}

/**
 * The explanatory line under a Stealth toggle.
 *
 * Both toggles render it, the send scene's and the swap amount-entry scene's,
 * with the same styles and the same "Learn more" target, so it lives in one
 * place rather than twice. Only the message differs.
 */
export const StealthInfoText: React.FC<Props> = props => {
  const { message, showLearnMore = false } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleLearnMore = useHandler((): void => {
    openBrowserUri(STEALTH_LEARN_MORE_URI).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    <View style={styles.container}>
      <EdgeText style={styles.text} numberOfLines={4}>
        {message}
        {showLearnMore ? ' ' : null}
        {showLearnMore ? (
          <EdgeText style={styles.link} onPress={handleLearnMore}>
            {lstrings.stealth_learn_more}
          </EdgeText>
        ) : null}
      </EdgeText>
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingHorizontal: theme.rem(1),
    paddingBottom: theme.rem(0.75)
  },
  text: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  },
  link: {
    color: theme.textLink,
    fontSize: theme.rem(0.75)
  }
}))
