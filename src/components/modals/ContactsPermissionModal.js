// @flow

import * as React from 'react'
import { View } from 'react-native'

import { Fontello } from '../../assets/vector'
import s from '../../locales/strings.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { ButtonsModal } from './ButtonsModal.js'
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
      <View style={styles.heanderContainer}>
        <View style={styles.iconCircle}>
          <Fontello
            name="edge.addresbook"
            size={theme.rem(1.5)}
            color={theme.icon}
          />
        </View>
        <EdgeText style={styles.header}>
          {s.strings.contacts_permission_modal_title}
        </EdgeText>
      </View>
      <EdgeText numberOfLines={0} style={styles.message}>
        {s.strings.contacts_permission_modal_text_1}
      </EdgeText>
      <EdgeText numberOfLines={0} style={styles.message}>
        {s.strings.contacts_permission_modal_text_2}
      </EdgeText>
      <EdgeText numberOfLines={0} style={styles.messageLast}>
        {s.strings.contacts_permission_modal_text_3}
      </EdgeText>
    </ButtonsModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  },
  heanderContainer: {
    marginTop: theme.rem(1),
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconCircle: {
    width: theme.rem(2.5),
    height: theme.rem(2.5),
    borderWidth: theme.thinLineWidth,
    borderRadius: theme.rem(1.25),
    borderColor: theme.icon,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    marginVertical: theme.rem(1),
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(1.25),
    includeFontPadding: false
  },
  message: {
    marginBottom: theme.rem(1)
  },
  messageLast: {
    marginBottom: theme.rem(4)
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5)
  }
}))
