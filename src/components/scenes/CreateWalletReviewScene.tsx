import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Image, Keyboard, View } from 'react-native'

import { createCurrencyWallet } from '../../actions/CreateWalletActions'
// @ts-expect-error
import CheckIcon from '../../assets/images/createWallet/check_icon_lg.png'
import s from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { fixFiatCurrencyCode } from '../../util/utils'
import { FullScreenTransitionComponent } from '../common/FullScreenTransition'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../tiles/Tile'

type OwnProps = {
  navigation: NavigationProp<'createWalletReview'>
  route: RouteProp<'createWalletReview'>
}
type DispatchProps = {
  createCurrencyWallet: (walletName: string, walletType: string, fiatCurrencyCode: string, cleanedPrivateKey?: string) => Promise<void>
}
type Props = OwnProps & DispatchProps & ThemeProps

type State = {
  isAnimationVisible: boolean
}

export class CreateWalletReviewComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      isAnimationVisible: false
    }
  }

  componentDidMount() {
    Keyboard.dismiss()
  }

  goToWalletList = () => {
    const { navigation } = this.props
    // @ts-expect-error
    navigation.navigate('walletListScene')
  }

  async createWallet() {
    const { createCurrencyWallet, navigation, route } = this.props
    const { walletName, selectedWalletType, selectedFiat, cleanedPrivateKey } = route.params
    // @ts-expect-error
    const createdWallet: EdgeCurrencyWallet | undefined = await createCurrencyWallet(
      walletName,
      selectedWalletType.walletType,
      fixFiatCurrencyCode(selectedFiat.value),
      cleanedPrivateKey
    ).catch(showError)
    // @ts-expect-error
    navigation.navigate('walletListScene')

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
    const { theme, route } = this.props
    const { selectedWalletType, selectedFiat, walletName } = route.params
    const { isAnimationVisible } = this.state
    const styles = getStyles(theme)
    const buttonType = theme.preferPrimaryButton ? 'primary' : 'secondary'

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
              body={`${selectedWalletType.currencyName} - ${selectedWalletType.currencyCode}`}
              contentPadding={false}
            />
            <Tile type="static" title={s.strings.create_wallet_fiat_type_label} body={selectedFiat.label} contentPadding={false} />
            <Tile type="static" title={s.strings.create_wallet_name_label} body={walletName} contentPadding={false} />
            <MainButton
              alignSelf="center"
              label={s.strings.fragment_create_wallet_create_wallet}
              marginRem={[2, 1]}
              type={buttonType}
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
      await dispatch(createCurrencyWallet(walletName, walletType, fiatCurrencyCode, importText))
    }
  })
)(withTheme(CreateWalletReviewComponent))
