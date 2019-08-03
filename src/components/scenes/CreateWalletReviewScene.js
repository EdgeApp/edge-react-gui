// @flow

import React, { Component } from 'react'
import { ActivityIndicator, Image, Keyboard, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import CheckIcon from '../../assets/images/createWallet/check_icon_lg.png'
import { WALLET_LIST_SCENE } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton, SecondaryButton } from '../../modules/UI/components/Buttons/index'
import Text from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import type { GuiFiatType, GuiWalletType } from '../../types/types.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { FullScreenTransitionComponent } from '../common/FullScreenTransition.js'

export type CreateWalletReviewOwnProps = {
  walletName: string,
  selectedFiat: GuiFiatType,
  selectedWalletType: GuiWalletType,
  isCreatingWallet: boolean,
  supportedWalletTypes: Array<GuiWalletType>,
  cleanedPrivateKey?: string // for creating wallet from import private key
}

export type CreateWalletReviewDispatchProps = {
  // should this return 'any'?
  createCurrencyWallet: (
    walletName: string,
    walletType: string,
    fiatCurrencyCode: string,
    isScenePop: boolean,
    selectWallet: boolean,
    cleanedPrivateKey?: string
  ) => any
}

export type CreateWalletReviewState = {
  isAnimationVisible: boolean
}

export type CreateWalletReviewProps = CreateWalletReviewOwnProps & CreateWalletReviewDispatchProps

export class CreateWalletReview extends Component<CreateWalletReviewProps, CreateWalletReviewState> {
  constructor (props: CreateWalletReviewProps) {
    super(props)
    this.state = {
      isAnimationVisible: false
    }
  }
  componentDidMount () {
    Keyboard.dismiss()
  }

  onSubmit = async () => {
    const { walletName, selectedWalletType, selectedFiat, cleanedPrivateKey, createCurrencyWallet } = this.props
    let isScenePop = true
    if (cleanedPrivateKey) isScenePop = false // don't pop after wallet create because we need animation
    const createdWallet = await createCurrencyWallet(
      walletName,
      selectedWalletType.value,
      fixFiatCurrencyCode(selectedFiat.value),
      isScenePop,
      false,
      cleanedPrivateKey
    )
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

  render () {
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
                  {s.strings.create_wallet_crypto_type_label} {this.props.selectedWalletType.label} - {this.props.selectedWalletType.currencyCode}
                </Text>
                <Text style={styles.reviewAreaText}>
                  {s.strings.create_wallet_fiat_type_label} {this.props.selectedFiat.label}
                </Text>
                <Text style={styles.reviewAreaText}>
                  {s.strings.create_wallet_name_label} {this.props.walletName}
                </Text>
              </View>

              <View style={[styles.buttons]}>
                <SecondaryButton style={[styles.cancel]} onPress={this.onBack}>
                  <SecondaryButton.Text>{s.strings.title_back}</SecondaryButton.Text>
                </SecondaryButton>

                <PrimaryButton style={[styles.create]} onPress={this.onSubmit} disabled={isCreatingWallet}>
                  {isCreatingWallet ? <ActivityIndicator /> : <PrimaryButton.Text>{s.strings.fragment_create_wallet_create_wallet}</PrimaryButton.Text>}
                </PrimaryButton>
              </View>
            </View>
          </View>
        ) : (
          <FullScreenTransitionComponent
            onDone={() => Actions.popTo(WALLET_LIST_SCENE)}
            image={<Image source={CheckIcon} style={[styles.currencyLogo, { marginBottom: 36 }]} resizeMode={'cover'} />}
            text={<Text style={styles.createWalletImportTransitionText}>{s.strings.create_wallet_import_successful}</Text>}
          />
        )}
      </SafeAreaView>
    )
  }
}
