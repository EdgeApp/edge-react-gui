import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeButton } from '../buttons/EdgeButton'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { SettingsHeaderRow } from '../settings/SettingsHeaderRow'
import { SettingsSwitchRow } from '../settings/SettingsSwitchRow'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

const POCKET_AMOUNTS_XMR = [0.1, 0.2, 0.3, 0.5, 0.8, 1.3]

export interface PocketChangeConfig {
  enabled: boolean
  amountIndex: number
}

interface Props {
  bridge: AirshipBridge<PocketChangeConfig | undefined>
  initialConfig: PocketChangeConfig
}

export const PocketChangeModal: React.FC<Props> = props => {
  const { bridge, initialConfig } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const [enabled, setEnabled] = React.useState(initialConfig.enabled)
  const [amountIndex, setAmountIndex] = React.useState(
    initialConfig.amountIndex
  )

  const handleCancel = useHandler((): void => {
    bridge.resolve(undefined)
  })

  const handleSave = useHandler((): void => {
    bridge.resolve({ enabled, amountIndex })
  })

  const handleToggle = useHandler((): void => {
    setEnabled(prev => !prev)
  })

  const handleDecrease = useHandler((): void => {
    setAmountIndex(prev => Math.max(0, prev - 1))
  })

  const handleIncrease = useHandler((): void => {
    setAmountIndex(prev => Math.min(POCKET_AMOUNTS_XMR.length - 1, prev + 1))
  })

  return (
    <EdgeModal
      bridge={bridge}
      onCancel={handleCancel}
      title={lstrings.pocketchange_title}
    >
      <View style={styles.container}>
        <Paragraph>{lstrings.pocketchange_description}</Paragraph>

        <SettingsSwitchRow
          label={lstrings.pocketchange_enable}
          value={enabled}
          onPress={handleToggle}
        />

        {enabled ? (
          <>
            <SettingsHeaderRow label={lstrings.pocketchange_amount_header} />

            <View style={styles.stepperRow}>
              <EdgeButton
                label="−"
                type="secondary"
                mini
                onPress={handleDecrease}
                disabled={amountIndex <= 0}
              />
              <EdgeText style={styles.amountText}>
                {POCKET_AMOUNTS_XMR[amountIndex]} XMR{' '}
                {lstrings.pocketchange_per_pocket}
              </EdgeText>
              <EdgeButton
                label="+"
                type="secondary"
                mini
                onPress={handleIncrease}
                disabled={amountIndex >= POCKET_AMOUNTS_XMR.length - 1}
              />
            </View>

            <Paragraph>{lstrings.pocketchange_explainer}</Paragraph>
          </>
        ) : null}

        <View style={styles.saveButton}>
          <EdgeButton label={lstrings.pocketchange_save} onPress={handleSave} />
        </View>
      </View>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingHorizontal: theme.rem(0.5)
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.rem(0.5)
  },
  amountText: {
    fontSize: theme.rem(1.1),
    marginHorizontal: theme.rem(1)
  },
  saveButton: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5)
  }
}))
