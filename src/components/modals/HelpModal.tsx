import * as React from 'react'
import { Image, Keyboard, Linking, Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { getBuildNumber, getVersion } from 'react-native-device-info'
import { WebView } from 'react-native-webview'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../assets/vector'
import s from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { PLATFORM } from '../../theme/variables/platform'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ModalFooter, ModalTitle } from '../themed/ModalParts'
import { SelectableRow } from '../themed/SelectableRow'
import { ThemedModal } from '../themed/ThemedModal'

const buildNumber = getBuildNumber()
const versionNumber = getVersion()
const HELP_URIS = {
  knowledgeBase: config.knowledgeBase,
  support: config.supportSite,
  call: config.phoneNumber,
  site: config.website
}

export async function showHelpModal(): Promise<unknown> {
  return Airship.show(bridge => <HelpModal bridge={bridge} />)
}

export function showWebViewModal(uri: string, title: string): void {
  Airship.show(bridge => <HelpWebViewModal bridge={bridge} uri={uri} title={title} />)
}

interface Props {
  bridge: AirshipBridge<void>
}

class HelpWebViewModal extends React.Component<Props & { uri: string; title: string }> {
  webview: WebView | null = null
  handleClose = () => this.props.bridge.resolve()

  render() {
    const { bridge, uri, title } = this.props
    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <ModalTitle center paddingRem={[0, 1, 1]}>
          {title}
        </ModalTitle>
        <WebView ref={element => (this.webview = element)} source={{ uri }} />

        <ModalFooter onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}

export class HelpModalComponent extends React.Component<Props & ThemeProps> {
  handleClose = () => this.props.bridge.resolve()

  handleEdgeSitePress = (helpSiteMoreInfoText: string) => {
    if (Platform.OS === 'android') {
      Linking.canOpenURL(HELP_URIS.site).then(supported => {
        if (supported) {
          Linking.openURL(HELP_URIS.site).catch(err => {
            console.log(err)
          })
        } else {
          console.log("Don't know how to open URI: " + HELP_URIS.site)
        }
      })
    } else {
      showWebViewModal(HELP_URIS.site, helpSiteMoreInfoText)
    }
  }

  componentDidMount() {
    Keyboard.dismiss()
  }

  render() {
    const { bridge, theme } = this.props
    const styles = getStyles(theme)
    const versionText = `${s.strings.help_version} ${versionNumber}`
    const buildText = `${s.strings.help_build} ${buildNumber}`
    const optionMarginRem = [0.75, 0, 0.5, 1]
    const optionPaddingRem = [0, 1, 1, 0]
    const helpModalTitle = sprintf(s.strings.help_modal_title_thanks, config.appName)
    const helpSiteMoreInfoText = sprintf(s.strings.help_site_more_info_text, config.appName)

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={[1, 0]}>
        <View style={styles.titleContainer}>
          <Image source={theme.primaryLogo} style={styles.logo} resizeMode="contain" />
          <ModalTitle center paddingRem={[0, 1, 1]}>
            {helpModalTitle}
          </ModalTitle>
        </View>

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_idea" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={s.strings.help_knowledge_base_text}
          title={s.strings.help_knowledge_base}
          underline
          onPress={() => showWebViewModal(HELP_URIS.knowledgeBase, s.strings.help_knowledge_base)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_headset" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={s.strings.help_support_text}
          title={s.strings.help_support}
          underline
          onPress={() => showWebViewModal(HELP_URIS.support, s.strings.help_support)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="help_call" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={s.strings.help_call_text}
          title={s.strings.help_call}
          underline
          onPress={async () => Linking.openURL(`tel:${HELP_URIS.call}`)}
        />

        <SelectableRow
          arrowTappable
          icon={<Fontello name="globe" color={theme.iconTappable} size={theme.rem(1.5)} />}
          marginRem={optionMarginRem}
          paddingRem={optionPaddingRem}
          subTitle={helpSiteMoreInfoText}
          title={sprintf(s.strings.help_visit_site, config.appName)}
          onPress={() => this.handleEdgeSitePress(helpSiteMoreInfoText)}
        />
        <View style={styles.footer}>
          <EdgeText style={styles.version}>{versionText}</EdgeText>
          <EdgeText style={styles.version}>{buildText}</EdgeText>
        </View>

        <ModalFooter onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  titleContainer: {
    marginTop: theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    height: theme.rem(2.25)
  },
  footer: {
    marginTop: PLATFORM.deviceHeight < theme.rem(42) ? 0 : theme.rem(1.5),
    paddingVertical: PLATFORM.deviceHeight < theme.rem(42) ? theme.rem(0.25) : theme.rem(0.5),
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  version: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75)
  }
}))

const HelpModal = withTheme(HelpModalComponent)
