import * as React from 'react'
import { View } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { openBrowserUri } from '../../util/WebUtils'
import { InformationCircleIcon } from '../icons/ThemedIcons'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

const LARGE_UTXO_WALLET_HELP_URI = 'https://support.edge.app/articles/13892386'

/**
 * Explains the slow sync and the temporarily inflated balance of a UTXO wallet
 * with a long transaction history, which is what drives the "my balance is
 * wrong" and "insufficient funds" support tickets. The article behind the
 * inline link covers the manual resync those users end up needing.
 *
 * Deliberately informational rather than alarming: the learn gradient and the
 * information icon, not the warning treatment the sync-status card above it
 * uses.
 *
 * Not dismissable, and not gated on the wallet currently syncing. A wallet in
 * this state can report itself fully synced while still showing stale balances
 * from unscanned distant addresses, which is exactly when the user is about to
 * try a send and be confused by the result.
 */
export const LargeUtxoWalletCard: React.FC = () => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleLearnMore = useHandler(() => {
    const uri = config.largeUtxoWalletLearnMoreUrl ?? LARGE_UTXO_WALLET_HELP_URI
    openBrowserUri(uri).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    // `EdgeCard`'s default 0.5rem margins are what the neighboring cards ask
    // for explicitly, so this one takes them rather than the deprecated
    // `marginRem` prop.
    <EdgeCard gradientBackground={theme.cardGradientLearn}>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <InformationCircleIcon
            color={theme.primaryText}
            size={theme.rem(1.25)}
            style={styles.icon}
          />
          <EdgeText numberOfLines={0} style={styles.titleText}>
            {lstrings.large_utxo_wallet_title}
          </EdgeText>
        </View>

        {/*
            The help link sits inline at the end of the copy rather than as a
            button, matching the Zcash migration card's treatment.
          */}
        <EdgeText style={styles.text} numberOfLines={10}>
          {lstrings.large_utxo_wallet_body}{' '}
          <EdgeText style={styles.learnMoreLink} onPress={handleLearnMore}>
            {lstrings.learn_more}
          </EdgeText>
        </EdgeText>
      </View>
    </EdgeCard>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    margin: theme.rem(0.5)
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  titleText: {
    marginLeft: theme.rem(0.2),
    fontFamily: theme.fontFaceMedium,
    flexShrink: 1
  },
  icon: {
    marginRight: theme.rem(0.2)
  },
  text: {
    fontSize: theme.rem(0.75),
    marginHorizontal: theme.rem(0.25),
    marginTop: theme.rem(0.5)
  },
  learnMoreLink: {
    fontSize: theme.rem(0.75),
    color: theme.textLink
  }
}))
