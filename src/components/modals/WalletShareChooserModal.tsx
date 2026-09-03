import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { DownloadIcon, ShareIcon } from '../icons/ThemedIcons'
import { useTheme } from '../services/ThemeContext'
import { SelectableRow } from '../themed/SelectableRow'
import { EdgeModal } from './EdgeModal'

export type WalletShareChoice = 'share' | 'receive'

interface Props {
  bridge: AirshipBridge<WalletShareChoice | undefined>
}

/**
 * The first step of wallet sharing: which side of the exchange is this
 * device on?
 */
export const WalletShareChooserModal: React.FC<Props> = props => {
  const { bridge } = props
  const theme = useTheme()

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })
  const handleShare = useHandler(() => {
    bridge.resolve('share')
  })
  const handleReceive = useHandler(() => {
    bridge.resolve('receive')
  })

  const iconSize = theme.rem(1.5)

  return (
    <EdgeModal
      bridge={bridge}
      title={lstrings.wallet_share_chooser_title}
      onCancel={handleCancel}
    >
      <SelectableRow
        icon={<ShareIcon size={iconSize} color={theme.iconTappable} />}
        title={lstrings.wallet_share_chooser_share_title}
        subTitle={lstrings.wallet_share_chooser_share_subtitle}
        onPress={handleShare}
      />
      <SelectableRow
        icon={<DownloadIcon size={iconSize} color={theme.iconTappable} />}
        title={lstrings.wallet_share_chooser_receive_title}
        subTitle={lstrings.wallet_share_chooser_receive_subtitle}
        onPress={handleReceive}
      />
    </EdgeModal>
  )
}
