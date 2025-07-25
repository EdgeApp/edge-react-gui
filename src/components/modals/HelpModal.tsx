import * as React from 'react'
import { Image, Keyboard, Linking, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { NavigationBase } from '../../types/routerTypes'
import { openBrowserUri } from '../../util/WebUtils'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { EdgeModal } from './EdgeModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()

export async function showHelpModal(navigation: NavigationBase): Promise<void> {
  return await Airship.show(bridge => (
    <HelpModal bridge={bridge} navigation={navigation} />
  ))
}

interface Props {
  bridge: AirshipBridge<void>
  navigation: NavigationBase
}

export const HelpModal = (props: Props) => {
  const { bridge, navigation } = props
  const theme = useTheme()
  const account = useSelector(state => state.core.account)
  const loggedIn = useWatch(account, 'loggedIn')

  const handleClose = useHandler(() => bridge.resolve())

  const handleSitePress = useHandler((title: string, uri: string) => {
    if (loggedIn) {
      navigation.navigate('webView', { title, uri })
      Airship.clear()
    } else {
      // Just open in a browser since we don't all the features of a full
      // logged-in scene:
      openBrowserUri(uri)
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
  const helpSiteMoreInfoText = sprintf(
    lstrings.help_site_more_info_text,
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
        subTitle={lstrings.help_knowledge_base_text}
        title={lstrings.help_knowledge_base}
        onPress={() =>
          handleSitePress(lstrings.help_knowledge_base, config.knowledgeBase)
        }
      />

      <SelectableRow
        icon={
          <Fontello
            name="help_headset"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        subTitle={lstrings.help_support_text}
        title={lstrings.help_support}
        onPress={() =>
          handleSitePress(lstrings.help_support, config.supportSite)
        }
      />

      <SelectableRow
        icon={
          <Fontello
            name="help_call"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        subTitle={lstrings.help_call_text}
        title={lstrings.help_call}
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
        subTitle={helpSiteMoreInfoText}
        title={sprintf(lstrings.help_visit_site, config.appName)}
        onPress={() => handleSitePress(helpSiteMoreInfoText, config.website)}
      />
      <SelectableRow
        icon={
          <Fontello
            name="doc-text"
            color={theme.iconTappable}
            size={theme.rem(1.5)}
          />
        }
        subTitle={lstrings.help_terms_of_service_text}
        title={lstrings.title_terms_of_service}
        onPress={() =>
          handleSitePress(
            lstrings.title_terms_of_service,
            config.termsOfServiceSite
          )
        }
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
