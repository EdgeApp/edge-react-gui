// @flow

import * as React from 'react'
import { ActivityIndicator, Image, Keyboard, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import CheckIcon from '../../assets/images/createWallet/check_icon_lg.png'
import { WALLET_LIST_SCENE } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { CreateWalletType, GuiFiatType } from '../../types/types.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { FullScreenTransitionComponent } from '../common/FullScreenTransition.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { SceneHeader } from '../themed/SceneHeader'
import { SecondaryButton } from '../themed/ThemedButtons'
import { Tile } from '../themed/Tile'

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
type Props = OwnProps & StateProps & DispatchProps & ThemeProps

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

  goToWalletList = () => Actions.popTo(WALLET_LIST_SCENE)

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

  render() {
    const { isCreatingWallet, theme } = this.props
    const { isAnimationVisible } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="theme">
        {!isAnimationVisible ? (
          <View style={styles.view}>
            <SceneHeader withTopMargin title={s.strings.title_create_wallet} />
            <EdgeText style={styles.instructionalText} numberOfLines={2}>
              {s.strings.create_wallet_top_instructions}
            </EdgeText>
            <Tile
              type="static"
              title={s.strings.create_wallet_crypto_type_label}
              body={`${this.props.selectedWalletType.currencyName} - ${this.props.selectedWalletType.currencyCode}`}
              contentPadding={false}
            />
            <Tile type="static" title={s.strings.create_wallet_fiat_type_label} body={this.props.selectedFiat.label} contentPadding={false} />
            <Tile type="static" title={s.strings.create_wallet_name_label} body={this.props.walletName} contentPadding={false} />

            <SecondaryButton style={styles.create} onPress={this.onSubmit} disabled={isCreatingWallet} marginRem={[2, 5, 1]}>
              {isCreatingWallet ? (
                <ActivityIndicator color={theme.iconTappable} />
              ) : (
                <EdgeText style={styles.createWalletBtnText}>{s.strings.fragment_create_wallet_create_wallet}</EdgeText>
              )}
            </SecondaryButton>
          </View>
        ) : (
          <FullScreenTransitionComponent
            onDone={this.goToWalletList}
            image={<Image source={CheckIcon} style={styles.currencyLogo} resizeMode="cover" />}
            text={<EdgeText style={styles.createWalletImportTransitionText}>{s.strings.create_wallet_import_successful}</EdgeText>}
          />
        )}
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  view: {
    flex: 1,
    position: 'relative'
  },
  currencyLogo: {
    alignSelf: 'center',
    marginTop: theme.rem(1.5),
    marginBottom: theme.rem(2.25),
    height: theme.rem(4),
    width: theme.rem(4)
  },
  instructionalText: {
    fontSize: theme.rem(1),
    color: theme.primaryText,
    paddingHorizontal: theme.rem(1),
    marginTop: theme.rem(0.5),
    marginBottom: theme.rem(2)
  },
  text: {
    color: theme.primaryText
  },
  create: {
    flex: 1
  },
  createWalletImportTransitionText: {
    fontSize: theme.rem(1.5),
    textAlign: 'center',
    color: theme.secondaryText
  },
  createWalletBtnText: {
    color: theme.secondaryButtonText
  }
}))

export const CreateWalletReviewScene = connect(
  (state: RootState): StateProps => ({
    isCreatingWallet: state.ui.scenes.createWallet.isCreatingWallet
  }),
  (dispatch: Dispatch): DispatchProps => ({
    createCurrencyWallet(walletName: string, walletType: string, fiatCurrencyCode: string, importText?: string) {
      dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, true, false, importText))
    }
  })
)(withTheme(CreateWalletReviewComponent))
