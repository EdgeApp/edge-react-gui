// @flow

import { type EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { getPluginId, getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { SafeAreaViewComponent as SafeAreaView } from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { scale } from '../../util/scaling.js'
import { FormField } from '../common/FormField.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { Airship } from '../services/AirshipInstance.js'

type OwnProps = {
  navigation: NavigationProp<'createWalletImport'>,
  route: RouteProp<'createWalletImport'>
}
type StateProps = {
  account: EdgeAccount
}
type Props = OwnProps & StateProps

type State = {
  input: string,
  error: string,
  isProcessing: boolean,
  cleanedPrivateKey: string
}

class CreateWalletImportComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      error: '',
      isProcessing: false,
      cleanedPrivateKey: ''
    }
  }

  handleNext = (): void => {
    const { account, navigation, route } = this.props
    const { selectedWalletType } = route.params
    const { input } = this.state
    const { walletType } = selectedWalletType
    const currencyPluginName = getPluginId(walletType)
    const currencyPlugin = account.currencyConfig[currencyPluginName]

    this.setState({ isProcessing: true })
    currencyPlugin
      .importKey(input)
      .then(() => {
        navigation.navigate('createWalletSelectFiat', {
          selectedWalletType,
          cleanedPrivateKey: input
        })
      })
      .catch(error =>
        Airship.show(bridge => (
          <ButtonsModal
            bridge={bridge}
            buttons={{ ok: { label: s.strings.string_ok } }}
            message={error.message}
            title={s.strings.create_wallet_failed_import_header}
          />
        ))
      )
      .then(() => this.setState({ isProcessing: false }))
  }

  onChangeText = (input: string) => {
    this.setState({ input })
  }

  render() {
    const { route } = this.props
    const { error, isProcessing, input } = this.state
    const { selectedWalletType } = route.params
    const { walletType } = selectedWalletType

    const specialCurrencyInfo = getSpecialCurrencyInfo(walletType)
    if (!specialCurrencyInfo.isImportKeySupported) throw new Error()
    const instructionSyntax = specialCurrencyInfo.isImportKeySupported.privateKeyInstructions
    const labelKeySyntax = specialCurrencyInfo.isImportKeySupported.privateKeyLabel
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.gradient} />
          <View style={styles.view}>
            <View style={styles.createWalletPromptArea}>
              <Text style={styles.instructionalText}>{instructionSyntax}</Text>
            </View>
            <FormField
              autoFocus
              autoCorrect={false}
              onChangeText={this.onChangeText}
              label={labelKeySyntax}
              value={input}
              returnKeyType="next"
              onSubmitEditing={this.handleNext}
              multiline
              error={error}
            />
            <View style={styles.buttons}>
              <PrimaryButton style={styles.next} onPress={this.handleNext} disabled={isProcessing}>
                {isProcessing ? (
                  <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
                ) : (
                  <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
                )}
              </PrimaryButton>
            </View>
          </View>
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

export const CreateWalletImportScene = connect<StateProps, {}, OwnProps>(
  state => ({
    account: state.core.account
  }),
  dispatch => ({})
)(CreateWalletImportComponent)
