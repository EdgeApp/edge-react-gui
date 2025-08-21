import * as React from 'react'
import { Image, Keyboard, Linking, View } from 'react-native'
import type { AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import type { NavigationBase } from '../../types/routerTypes'
import { openBrowserUri } from '../../util/WebUtils'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { EdgeModal } from './EdgeModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()

export async function showHelpModal(navigation: NavigationBase): Promise<void> {
  await Airship.show(bridge => (
    <HelpModal bridge={bridge} navigation={navigation} />
  ))
}

interface Props {
  bridge: AirshipBridge<void>
  navigation: NavigationBase
}

export const HelpModal: React.FC<Props> = (props: Props) => {
  const { bridge, navigation } = props
  const theme = useTheme()
  const account = useSelector(state => state.core.account)
  const loggedIn = useWatch(account, 'loggedIn')

  const handleClose = useHandler(() => {
    bridge.resolve()
  })

  const handleSitePress = useHandler(async (title: string, uri: string) => {
    if (loggedIn) {
      navigation.navigate('webView', { title, uri })
      Airship.clear()
    } else {
      // Just open in a browser since we don't all the features of a full
      // logged-in scene:
      await openBrowserUri(uri)
    }
  })

  React.useEffect(() => {
    Keyboard.dismiss()
  }, [])

  const styles = getStyles(theme)
  const versionText = `${lstrings.help_version} ${versionNumber}`
  const buildText = `${lstrings.help_build} ${buildNumber}`
  const helpModalTitle = sprintf(
    lstrings.help_modal_title_thanks,
    config.appName
  )
  const helpOfficialSiteText = sprintf(
    lstrings.help_official_site_text,
    config.appName
  )

  return (
    <EdgeModal
      bridge={bridge}
      title={
        <View style={styles.titleContainer}>
          <Image
            source={theme.primaryLogo}
            style={styles.logo}
            resizeMode="contain"
          />
          <ModalTitle center>{helpModalTitle}</ModalTitle>
        </View>
      }
      onCancel={handleClose}
      scroll
    >
      <SelectableRow
        icon={
          <Fontello
            name="help_idea"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        title={lstrings.help_faq}
        subTitle={lstrings.help_faq_text}
        onPress={async () => {
          await handleSitePress(lstrings.help_faq, config.knowledgeBase)
        }}
      />

      {config.supportChatSite == null ? null : (
        <SelectableRow
          icon={
            <Ionicons
              name="chatbubbles-outline"
              color={theme.iconTappable}
              size={theme.rem(1.5)}
            />
          }
          title={lstrings.help_live_chat}
          subTitle={lstrings.help_live_chat_text}
          onPress={async () => {
            if (config.supportChatSite == null) return
            await openBrowserUri(config.supportChatSite)
          }}
        />
      )}

      <SelectableRow
        icon={
          <Fontello
            name="help_headset"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        title={lstrings.help_support}
        subTitle={lstrings.help_support_text}
        onPress={async () => {
          await handleSitePress(lstrings.help_support, config.supportSite)
        }}
      />

      <SelectableRow
        icon={
          <Fontello
            name="help_call"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        title={lstrings.help_call_agent}
        subTitle={lstrings.help_call_agent_text}
        onPress={async () => await Linking.openURL(`tel:${config.phoneNumber}`)}
      />

      <SelectableRow
        icon={
          <Fontello
            name="globe"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        title={lstrings.help_official_site}
        subTitle={helpOfficialSiteText}
        onPress={async () => {
          await handleSitePress(helpOfficialSiteText, config.website)
        }}
      />
      <View style={styles.footer}>
        <EdgeText style={styles.version}>{versionText}</EdgeText>
        <EdgeText style={styles.version}>{buildText}</EdgeText>
      </View>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.rem(0.25)
  },
  logo: {
    height: theme.rem(2.25),
    marginVertical: theme.rem(0.5)
  },
  footer: {
    marginTop: theme.rem(0),
    paddingVertical: theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  version: {
    color: theme.secondaryText
  }
}))
