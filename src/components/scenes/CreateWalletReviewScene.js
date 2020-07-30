// @flow

import * as React from 'react'
import { ActivityIndicator, Image, Keyboard, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import CheckIcon from '../../assets/images/createWallet/check_icon_lg.png'
import { WALLET_LIST_SCENE } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { SecondaryButton } from '../../modules/UI/components/Buttons/SecondaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import type { CreateWalletType, GuiFiatType } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { FullScreenTransitionComponent } from '../common/FullScreenTransition.js'

type OwnProps = {
  walletName: string,
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  cleanedPrivateKey?: string // for creating wallet from import private key
}
type StateProps = {
  isCreatingWallet: boolean
}
type DispatchProps = {
  createCurrencyWallet(walletName: string, walletType: string, fiatCurrencyCode: string, cleanedPrivateKey?: string): void
}
type Props = OwnProps & StateProps & DispatchProps

type State = {
  isAnimationVisible: boolean
}

class CreateWalletReviewComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isAnimationVisible: false
    }
  }

  componentDidMount() {
    Keyboard.dismiss()
  }

  onSubmit = async () => {
    const { walletName, selectedWalletType, selectedFiat, cleanedPrivateKey, createCurrencyWallet } = this.props
    const createdWallet = await createCurrencyWallet(walletName, selectedWalletType.walletType, fixFiatCurrencyCode(selectedFiat.value), cleanedPrivateKey)
    // note that we will be using cleanedPrivateKey as a flag for an imported private key
    if (createdWallet && cleanedPrivateKey) {
      this.setState({
        isAnimationVisible: true
      })
    }
  }

  onBack = () => {
    Actions.pop()
  }

  render() {
    const { isCreatingWallet } = this.props
    const { isAnimationVisible } = this.state

    return (
      <SafeAreaView>
        {!isAnimationVisible ? (
          <View style={styles.scene}>
            <Gradient style={styles.gradient} />

            <View style={styles.view}>
              <View style={styles.instructionalArea}>
                <Text style={styles.instructionalText}>{s.strings.create_wallet_top_instructions}</Text>
              </View>
              <View style={styles.reviewArea}>
                <Text style={styles.reviewAreaText}>
                  {s.strings.create_wallet_crypto_type_label} {this.props.selectedWalletType.currencyName} - {this.props.selectedWalletType.currencyCode}
                </Text>
                <Text style={styles.reviewAreaText}>
                  {s.strings.create_wallet_fiat_type_label} {this.props.selectedFiat.label}
                </Text>
                <Text style={styles.reviewAreaText}>
                  {s.strings.create_wallet_name_label} {this.props.walletName}
                </Text>
              </View>

              <View style={styles.buttons}>
                <SecondaryButton style={styles.cancel} onPress={this.onBack}>
                  <SecondaryButton.Text>{s.strings.title_back}</SecondaryButton.Text>
                </SecondaryButton>

                <PrimaryButton style={styles.create} onPress={this.onSubmit} disabled={isCreatingWallet}>
                  {isCreatingWallet ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.fragment_create_wallet_create_wallet}</PrimaryButton.Text>}
                </PrimaryButton>
              </View>
            </View>
          </View>
        ) : (
          <FullScreenTransitionComponent
            onDone={() => Actions.popTo(WALLET_LIST_SCENE)}
            image={<Image source={CheckIcon} style={[styles.currencyLogo, { marginBottom: 36 }]} resizeMode="cover" />}
            text={<Text style={styles.createWalletImportTransitionText}>{s.strings.create_wallet_import_successful}</Text>}
          />
        )}
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
  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1
  },
  reviewArea: {
    paddingVertical: scale(18)
  },
  reviewAreaText: {
    fontSize: scale(16),
    lineHeight: scale(24),
    color: THEME.COLORS.BLACK
  },
  text: {
    color: THEME.COLORS.WHITE
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  create: {
    flex: 1
  },
  cancel: {
    flex: 1,
    marginRight: scale(2),
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  createWalletImportTransitionText: {
    fontSize: 24,
    textAlign: 'center',
    color: THEME.COLORS.SECONDARY
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const CreateWalletReviewScene = connect(
  (state: ReduxState): StateProps => ({
    isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet
  }),
  (dispatch: Dispatch): DispatchProps => ({
    createCurrencyWallet(walletName: string, walletType: string, fiatCurrencyCode: string, importText?: string) {
      dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, true, false, importText))
    }
  })
)(CreateWalletReviewComponent)
