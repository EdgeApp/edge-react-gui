import * as React from 'react'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { PaymentMethod } from '../../../controllers/action-queue/WyreClient'
import s from '../../../locales/strings'
import { asGuiPluginJson } from '../../../types/GuiPluginTypes'
import { memo, useState } from '../../../types/reactHooks'
import { getPartnerIconUri } from '../../../util/CdnUris'
import { FiatIcon } from '../../icons/FiatIcon'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { IconDataRow } from './IconDataRow'

type Props = {
  marginRem?: number[] | number
  paymentMethod: PaymentMethod
  pluginId: string
}

// -----------------------------------------------------------------------------
// A view representing the data from a wallet, used for rows, cards, etc.
// -----------------------------------------------------------------------------
const PaymentMethodRowComponent = (props: Props) => {
  const { marginRem, paymentMethod, pluginId } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const buyPluginJson = asGuiPluginJson(require('../../../constants/plugins/buyPluginList.json'))
  const sellPluginJson = asGuiPluginJson(require('../../../constants/plugins/sellPluginList.json'))
  const pluginJson = [...buyPluginJson, ...sellPluginJson]
  const guiPlugin = guiPlugins[pluginId]
  if (guiPlugin == null) throw new Error(`PaymentMethodRow could not find ${pluginId} plugin`)

  const [isFirstRun, setIsFirstRun] = useState(true)
  const [partnerIconPath, setPartnerIconPath] = useState()

  if (isFirstRun) {
    for (const row of pluginJson) {
      if (typeof row === 'string') continue
      if (row.pluginId === pluginId && row.partnerIconPath != null) {
        setPartnerIconPath(row.partnerIconPath)
        setIsFirstRun(false)
      }
    }
  }

  if (!isFirstRun && partnerIconPath == null) throw new Error(`PaymentMethodRow could not find icon for ${pluginId} plugin`)

  const fiatCurrencyCode = paymentMethod.defaultCurrency
  const mainIcon = <FiatIcon fiatCurrencyCode={fiatCurrencyCode} />
  const name = paymentMethod.name
  const partnerIconUri = partnerIconPath != null ? getPartnerIconUri(partnerIconPath) : null
  const pluginDisplay = (
    <>
      <FastImage source={{ uri: partnerIconUri }} style={styles.partnerIconImage} />
      <EdgeText style={styles.pluginText}>{guiPlugin.displayName}</EdgeText>
    </>
  )

  return (
    <IconDataRow
      icon={mainIcon}
      leftText={fiatCurrencyCode}
      leftSubtext={name}
      rightSubText={s.strings.plugin_powered_by_space + ' '}
      rightSubTextExtended={pluginDisplay}
      marginRem={marginRem}
    />
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  pluginText: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  partnerIconImage: {
    aspectRatio: 1,
    width: theme.rem(0.75),
    height: theme.rem(0.75)
  }
}))

export const PaymentMethodRow = memo(PaymentMethodRowComponent)
