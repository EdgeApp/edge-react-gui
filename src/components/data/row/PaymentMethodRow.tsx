import * as React from 'react'
import FastImage from 'react-native-fast-image'
import { cacheStyles } from 'react-native-patina'

import buyPluginJsonRaw from '../../../constants/plugins/buyPluginList.json'
import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import sellPluginJsonRaw from '../../../constants/plugins/sellPluginList.json'
import { PaymentMethod } from '../../../controllers/action-queue/WyreClient'
import { lstrings } from '../../../locales/strings'
import { asGuiPluginJson } from '../../../types/GuiPluginTypes'
import { getPartnerIconUri } from '../../../util/CdnUris'
import { FiatIcon } from '../../icons/FiatIcon'
import { Theme, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { IconDataRow } from './IconDataRow'

interface Props {
  marginRem?: number[] | number
  paymentMethod: PaymentMethod
  pluginId: string
}

// -----------------------------------------------------------------------------
// A view representing the data from a wallet, used for rows, cards, etc.
// -----------------------------------------------------------------------------
const PaymentMethodRowComponent = (props: Props) => {
  const { marginRem, paymentMethod, pluginId } = props

  // #region Initialization

  // Validate plugin data
  const buyPluginJson = asGuiPluginJson(buyPluginJsonRaw)
  const sellPluginJson = asGuiPluginJson(sellPluginJsonRaw)
  const pluginJson = [...buyPluginJson, ...sellPluginJson]
  const guiPlugin = guiPlugins[pluginId]

  const [isFirstRun, setIsFirstRun] = React.useState(true)
  const [partnerIconPath, setPartnerIconPath] = React.useState<string | undefined>(undefined)

  if (guiPlugin == null) throw new Error(`PaymentMethodRow could not find ${pluginId} plugin`)

  if (isFirstRun) {
    for (const row of pluginJson) {
      if (typeof row === 'string') continue
      if (row.pluginId === pluginId && row.partnerIconPath !== undefined) {
        setPartnerIconPath(row.partnerIconPath)
        setIsFirstRun(false)
      }
    }
  }

  if (!isFirstRun && partnerIconPath == null) throw new Error(`PaymentMethodRow could not find icon for ${pluginId} plugin`)

  // #endregion Initialization

  // #region Constants

  const theme = useTheme()
  const styles = getStyles(theme)
  const fiatCurrencyCode = paymentMethod.defaultCurrency
  const mainIcon = <FiatIcon fiatCurrencyCode={fiatCurrencyCode} />
  const name = paymentMethod.name
  const partnerIconUri = partnerIconPath != null ? getPartnerIconUri(partnerIconPath) : undefined

  // #endregion Constants

  // #region Renderers

  const renderPluginDisplay = () => (
    <>
      <FastImage source={{ uri: partnerIconUri }} style={styles.partnerIconImage} />
      <EdgeText style={styles.pluginText}>{guiPlugin.displayName}</EdgeText>
    </>
  )

  // #endregion Renderers

  return (
    <IconDataRow
      icon={mainIcon}
      leftText={fiatCurrencyCode}
      leftSubtext={name}
      rightSubText={lstrings.plugin_powered_by_space + ' '}
      rightSubTextExtended={renderPluginDisplay()}
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

export const PaymentMethodRow = React.memo(PaymentMethodRowComponent)
