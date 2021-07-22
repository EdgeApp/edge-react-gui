// @flow

import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { cacheStyles } from 'react-native-patina'

import s from '../../locales/strings'
import { type Theme, useTheme } from '../services/ThemeContext'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { PrimaryButton } from '../themed/PrimaryButton.js'
import { ThemedModal } from '../themed/ThemedModal.js'

export function FioExpiredModal(props: { bridge: AirshipBridge<boolean | void>, fioName: string, isAddress: boolean }) {
  const { bridge, fioName, isAddress } = props
  const title = `${s.strings.fio_address_confirm_screen_fio_label} ${s.strings.string_expiration}`
  const styles = getStyles(useTheme())

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(undefined)} paddingRem={[1, 0.5]}>
      <ModalTitle>{title}</ModalTitle>
      <ModalMessage>{isAddress ? s.strings.fio_address_details_expired_soon : s.strings.fio_domain_details_expired_soon}</ModalMessage>
      <ModalMessage>{fioName}</ModalMessage>
      <View style={styles.center}>
        <View style={styles.buttonWidth}>
          <PrimaryButton label={s.strings.title_fio_renew} marginRem={[1.75, 0, 1]} outlined onPress={() => bridge.resolve(true)} />
        </View>
      </View>
      <ModalCloseArrow onPress={() => bridge.resolve(undefined)} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  center: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonWidth: {
    width: theme.rem(7)
  }
}))
