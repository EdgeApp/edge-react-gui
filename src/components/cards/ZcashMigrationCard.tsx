import * as React from 'react'
import { View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { openBrowserUri } from '../../util/WebUtils'
import { EdgeButton } from '../buttons/EdgeButton'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeCard } from './EdgeCard'

const ZCASH_MIGRATION_HELP_URI = 'https://support.edge.app/articles/16111542'

interface Props {
  /**
   * The Orchard-pool balance at risk, pre-formatted with its denomination.
   * ZIP 318 requires the entry point to show this specific figure rather than
   * the wallet's whole shielded balance, since only Orchard funds cross the
   * turnstile.
   */
  orchardBalanceText: string
  onMigratePress: () => Promise<void> | void
}

/**
 * Orchard -> Ironwood (NU6.3) migration card for the Zcash wallet scene.
 *
 * Its own component rather than an `AlertCardUi4` because the help link is
 * inline in the copy rather than a second button, which that card cannot do.
 *
 * Not dismissable: the card clears on its own once the Orchard balance empties,
 * by the sweep or by ordinary spends draining it passively.
 */
export const ZcashMigrationCard: React.FC<Props> = props => {
  const { orchardBalanceText, onMigratePress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // Returned, not swallowed: EdgeButton's usePendingPress only shows the spinner
  // and blocks re-taps when it receives a thenable, and it reports errors itself.
  // Preparing the sweep does real work (getAddresses, getMaxSpendable), so the
  // button must not stay tappable through it.
  const handleMigrate = useHandler(async (): Promise<void> => {
    await onMigratePress()
  })

  const handleLearnMore = useHandler(() => {
    const uri = config.zcashMigrationLearnMoreUrl ?? ZCASH_MIGRATION_HELP_URI
    openBrowserUri(uri).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    <EdgeCard
      gradientBackground={theme.cardGradientWarning}
      marginRem={[0.5, 0.5, 0, 0.5]}
    >
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <IonIcon
            name="warning-outline"
            style={styles.icon}
            color={theme.primaryText}
            size={theme.rem(1.25)}
          />
          <EdgeText numberOfLines={0} style={styles.titleText}>
            {lstrings.zcash_migration_recommended_title}
          </EdgeText>
        </View>

        {/*
          The help link is inline at the end of the copy rather than a second
          button, so the card keeps a single call to action. Nested EdgeText with
          its own onPress, per the Stealth Send treatment.
        */}
        <EdgeText style={styles.text} numberOfLines={10}>
          {sprintf(
            lstrings.zcash_migration_recommended_body_1s,
            orchardBalanceText
          )}{' '}
          <EdgeText style={styles.learnMoreLink} onPress={handleLearnMore}>
            {lstrings.zcash_migration_learn_more_button}
          </EdgeText>
        </EdgeText>

        <View style={styles.buttonContainer}>
          <EdgeButton
            label={lstrings.zcash_migration_recommended_button}
            layout="solo"
            mini
            onPress={handleMigrate}
            type="primary"
          />
        </View>
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
  },
  buttonContainer: {
    marginTop: theme.rem(1)
  }
}))
