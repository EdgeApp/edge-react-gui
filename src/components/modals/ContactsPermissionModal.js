// @flow

import * as React from 'react'
import { View } from 'react-native'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import s from '../../locales/strings.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { type AirshipBridge } from './modalParts.js'

export function ContactsPermissionModal(props: { bridge: AirshipBridge<any> }) {
  const { bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <ButtonsModal
      bridge={bridge}
      buttons={{
        ok: { label: s.strings.string_allow }
      }}
      closeButton
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <FontAwesome name="address-book" size={theme.rem(1.5)} color={theme.icon} />
          <ModalTitle>{s.strings.contacts_permission_modal_title}</ModalTitle>
        </View>
        <ModalMessage>{s.strings.contacts_permission_modal_text_1}</ModalMessage>
        <ModalMessage>{s.strings.contacts_permission_modal_text_2}</ModalMessage>
      </View>
    </ButtonsModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5)
  }
}))
