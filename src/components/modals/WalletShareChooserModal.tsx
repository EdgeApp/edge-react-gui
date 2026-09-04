import * as React from 'react'
import { View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { DownloadIcon, ShareIcon } from '../icons/ThemedIcons'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { SelectableRow } from '../themed/SelectableRow'
import { EdgeModal } from './EdgeModal'

export type WalletShareChoice = 'share' | 'receive'

interface Props {
  bridge: AirshipBridge<WalletShareChoice | undefined>
  /** The name this device shares under, shown so it can be checked or fixed. */
  nickname: string
  onEditNickname: () => void
}

/**
 * The first step of wallet sharing: which side of the exchange is this
 * device on?
 */
export const WalletShareChooserModal: React.FC<Props> = props => {
  const { bridge, nickname, onEditNickname } = props
  const theme = useTheme()
  const styles = getStyles(theme)

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
      <View style={styles.nicknameContainer}>
        <EdgeTouchableOpacity
          accessibilityHint={lstrings.wallet_share_nickname_title}
          onPress={onEditNickname}
          testID="walletShareNickname"
        >
          <EdgeText style={styles.nickname}>{nickname}</EdgeText>
        </EdgeTouchableOpacity>
      </View>
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

const getStyles = cacheStyles((theme: Theme) => ({
  nicknameContainer: {
    alignItems: 'center',
    marginBottom: theme.rem(0.5)
  },
  nickname: {
    color: theme.textLink,
    fontFamily: theme.fontFaceMedium
  }
}))
