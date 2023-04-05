import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { borrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { config } from '../../theme/appConfig'
import { getBorrowPluginIconUri } from '../../util/CdnUris'
import { Space } from '../layout/Space'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'

export const LoanWelcomeModal = (props: { bridge: AirshipBridge<'ok' | undefined> }) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const { bridge } = props

  // HACK: Temporary icon placeholder until we get a more refined icon.
  const defaultBorrowPlugin = borrowPlugins[0]
  const iconUri = getBorrowPluginIconUri(defaultBorrowPlugin.borrowInfo)

  return (
    <ButtonsModal bridge={bridge} buttons={{ ok: { label: lstrings.legacy_address_modal_continue } }}>
      <Space around={1}>
        <FastImage style={styles.icon} source={{ uri: iconUri }} />
        <EdgeText numberOfLines={20}>{sprintf(lstrings.loan_welcome_6s, config.appName, lstrings.loan_aave_fragment, 'BTC', 'USDC', '10', '120')}</EdgeText>
      </Space>
    </ButtonsModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    icon: {
      alignSelf: 'center',
      height: theme.rem(3),
      width: theme.rem(3),
      marginBottom: theme.rem(1)
    }
  }
})
