// @flow

import * as React from 'react'
import { Image, ScrollView, StyleSheet, View } from 'react-native'

import WalletIcon from '../../assets/images/createWallet/wallet_icon_lg.png'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { SafeAreaViewComponent as SafeAreaView } from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { scale } from '../../util/scaling.js'

type OwnProps = {
  navigation: NavigationProp<'createWalletChoice'>,
  route: RouteProp<'createWalletChoice'>
}

type Props = OwnProps

export class CreateWalletChoiceComponent extends React.PureComponent<Props> {
  onSelectNew = () => {
    const { navigation, route } = this.props
    const { selectedWalletType } = route.params
    navigation.navigate('createWalletSelectFiat', {
      selectedWalletType
    })
  }

  onSelectRestore = () => {
    const { navigation, route } = this.props
    const { selectedWalletType } = route.params
    navigation.navigate('createWalletImport', {
      selectedWalletType
    })
  }

  render() {
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <ScrollView>
            <View style={styles.view}>
              <Image source={WalletIcon} style={styles.currencyLogo} resizeMode="cover" />
              <View style={styles.createWalletPromptArea}>
                <Text style={styles.instructionalText}>{s.strings.create_wallet_choice_instructions}</Text>
              </View>
              <View style={styles.buttons}>
                <PrimaryButton style={styles.next} onPress={this.onSelectNew}>
                  <PrimaryButton.Text>{s.strings.create_wallet_choice_new_button}</PrimaryButton.Text>
                </PrimaryButton>
              </View>
              <View style={styles.buttons}>
                <SecondaryButton style={styles.next} onPress={this.onSelectRestore}>
                  <SecondaryButton.Text>{s.strings.create_wallet_import_title}</SecondaryButton.Text>
                </SecondaryButton>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    )
  }
}

const rawStyles = {
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%',
    position: 'absolute'
  },
  view: {
    position: 'relative',
    top: THEME.HEADER,
    paddingHorizontal: 20,
    height: PLATFORM.usableHeight
  },
  currencyLogo: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(64),
    width: scale(64)
  },
  createWalletPromptArea: {
    paddingTop: scale(16),
    paddingBottom: scale(8)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
