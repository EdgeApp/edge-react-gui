// @flow

import * as React from 'react'
import { Image, Keyboard, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { createCurrencyWallet } from '../../actions/CreateWalletActions.js'
import CheckIcon from '../../assets/images/createWallet/check_icon_lg.png'
import { WALLET_LIST_SCENE } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import type { CreateWalletType, GuiFiatType } from '../../types/types.js'
import { fixFiatCurrencyCode } from '../../util/utils'
import { FullScreenTransitionComponent } from '../common/FullScreenTransition.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../themed/Tile'

type OwnProps = {
  walletName: string,
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  cleanedPrivateKey?: string // for creating wallet from import private key
}
type DispatchProps = {
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string, cleanedPrivateKey?: string) => Promise<void>
}
type Props = OwnProps & DispatchProps & ThemeProps

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

  async createWallet() {
    const { walletName, selectedWalletType, selectedFiat, cleanedPrivateKey, createCurrencyWallet } = this.props
    const createdWallet = await createCurrencyWallet(walletName, selectedWalletType.walletType, fixFiatCurrencyCode(selectedFiat.value), cleanedPrivateKey)
    // note that we will be using cleanedPrivateKey as a flag for an imported private key
    if (createdWallet && cleanedPrivateKey) {
      this.setState({
        isAnimationVisible: true
      })
    }
  }

  handleSubmit = async (): Promise<void> => {
    await this.createWallet().catch(showError)
  }

  render() {
    const { theme } = this.props
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
            <MainButton
              alignSelf="center"
              label={s.strings.fragment_create_wallet_create_wallet}
              marginRem={[2, 1]}
              type="secondary"
              onPress={this.handleSubmit}
            />
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
  createWalletImportTransitionText: {
    fontSize: theme.rem(1.5),
    textAlign: 'center',
    color: theme.secondaryText
  }
}))

export const CreateWalletReviewScene = connect<{}, DispatchProps, OwnProps>(
  state => ({}),
  dispatch => ({
    async createCurrencyWallet(walletName: string, walletType: string, fiatCurrencyCode: string, importText?: string) {
      await dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, true, false, importText))
    }
  })
)(withTheme(CreateWalletReviewComponent))
