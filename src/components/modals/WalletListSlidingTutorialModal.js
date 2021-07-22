// @flow

import * as React from 'react'
import { Image } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'

import s from '../../locales/strings.js'
import { useTheme } from '../services/ThemeContext.js'
import { ModalTitle } from '../themed/ModalParts.js'
import { PrimaryButton } from '../themed/PrimaryButton.js'

type Props = {
  bridge: AirshipBridge<void>
}

export function WalletListSlidingTutorialModal(props: Props) {
  const { bridge } = props
  const theme = useTheme()

  return (
    <AirshipModal
      bridge={bridge}
      onCancel={() => bridge.resolve()}
      backgroundColor={theme.modal}
      borderRadius={theme.rem(1)}
      padding={theme.rem(1)}
      underlay={theme.tutorialModalUnderlay}
    >
      <ModalTitle>{s.strings.wallet_list_swipe_tutorial_title}</ModalTitle>
      <Image source={theme.walletListSlideTutorialImage} resizeMode="contain" style={{ height: theme.rem(3), width: '100%' }} />
      <PrimaryButton label={s.strings.string_ok} onPress={() => bridge.resolve()} marginRem={0.5} />
    </AirshipModal>
  )
}
