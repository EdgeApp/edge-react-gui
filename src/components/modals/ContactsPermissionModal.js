// @flow
import { useCavy } from 'cavy'
import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import s from '../../locales/strings.js'
import { config } from '../../theme/appConfig'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'

export type ContactsPermissionResult = 'allow' | 'deny'
const message1 = sprintf(s.strings.contacts_permission_modal_body_1, config.appName)
const message2 = sprintf(s.strings.contacts_permission_modal_body_2, config.appName)
const message3 = sprintf(s.strings.contacts_permission_modal_body_3, config.appName)

export function ContactsPermissionModal(props: { bridge: AirshipBridge<any> }) {
  const { bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const generateTestHook = useCavy()

  return (
    <ButtonsModal
      bridge={bridge}
      disableCancel
      buttons={{
        allow: { label: s.strings.string_allow },
        deny: { label: s.strings.string_deny }
      }}
      fullScreen
      ref={generateTestHook('ContactPermissionModal.Close')}
    >
      <View style={styles.headerContainer}>
        <View style={styles.iconCircle}>
          <Fontello name="edge.addresbook" size={theme.rem(1.5)} color={theme.icon} />
        </View>
        <EdgeText style={styles.header}>{s.strings.contacts_permission_modal_title}</EdgeText>
      </View>
      <EdgeText numberOfLines={0} style={styles.message}>
        {message1}
      </EdgeText>
      <EdgeText numberOfLines={0} style={styles.message}>
        {message2}
      </EdgeText>
      <EdgeText numberOfLines={0} style={styles.message}>
        {message3}
      </EdgeText>
    </ButtonsModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
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
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.25),
    includeFontPadding: false
  },
  message: {
    marginBottom: theme.rem(1)
  }
}))
