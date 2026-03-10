import * as React from 'react'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { CURRENCY_SETTINGS_KEYS } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { CryptoIcon } from '../icons/CryptoIcon'
import { SceneContainer } from '../layout/SceneContainer'
import { showToast } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsRow } from '../settings/SettingsRow'
import { SettingsTappableRow } from '../settings/SettingsTappableRow'

interface Props extends EdgeAppSceneProps<'assetSettings'> {}

export function AssetSettingsScene(props: Props): React.ReactElement {
  const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const { currencyWallets } = account

  /**
   * Iterates through all the user's currency wallets, updates the enabled token
   * IDs to include any newly detected tokens, and then displays a toast message
   * indicating whether any detected tokens were enabled.
   */
  const handleRescanTokens = useHandler(async () => {
    let isTokensDetected = false
    for (const wallet of Object.values(currencyWallets)) {
      const detectedDisabledTokens = wallet.detectedTokenIds.filter(
        dt => !wallet.enabledTokenIds.includes(dt)
      )

      if (detectedDisabledTokens.length > 0) {
        await wallet.changeEnabledTokenIds([
          ...wallet.enabledTokenIds,
          ...detectedDisabledTokens
        ])
        isTokensDetected = true
      }
    }

    if (isTokensDetected) {
      showToast(lstrings.settings_enable_detected_tokens_toast)
    } else {
      showToast(lstrings.settings_no_detected_tokens_toast)
    }
  })

  return (
    <SceneWrapper scroll>
      <SceneContainer>
        <EdgeCard>
          <SettingsRow
            label={lstrings.settings_detect_tokens}
            onPress={handleRescanTokens}
            right={
              <FontAwesomeIcon
                name="refresh"
                size={theme.rem(1)}
                color={theme.iconTappable}
                style={styles.rightIcon}
              />
            }
          />
        </EdgeCard>
        <EdgeCard sections>
          {CURRENCY_SETTINGS_KEYS.map(pluginId => {
            if (account.currencyConfig[pluginId] == null) return null
            const { currencyInfo } = account.currencyConfig[pluginId]
            const { displayName } = currencyInfo
            const onPress = (): void => {
              navigation.navigate('currencySettings', {
                currencyInfo
              })
            }

            return (
              <SettingsTappableRow
                key={pluginId}
                label={displayName}
                onPress={onPress}
              >
                <CryptoIcon
                  marginRem={[0.5, 0, 0.5, 0.5]}
                  pluginId={pluginId}
                  tokenId={null}
                  sizeRem={1.25}
                />
              </SettingsTappableRow>
            )
          })}
        </EdgeCard>
      </SceneContainer>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  rightIcon: {
    marginHorizontal: theme.rem(0.5)
  }
}))
