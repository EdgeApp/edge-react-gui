import { EdgeCurrencyConfig } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { checkHandleAvailability } from '../../actions/CreateWalletActions'
import invalidIcon from '../../assets/images/createWallet/invalid_icon.png'
import validIcon from '../../assets/images/createWallet/valid_icon.png'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import s from '../../locales/strings'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui'
import { HandleAvailableStatus } from '../../reducers/scenes/CreateWalletReducer'
import { THEME } from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'
import { connect } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { scale } from '../../util/scaling'
import { logEvent } from '../../util/tracking'
import { debounce } from '../../util/utils'
import { FormField, MaterialInputOnWhite } from '../common/FormField'
import { SceneWrapper } from '../common/SceneWrapper'

const deviceWidth = PLATFORM.deviceWidth

interface OwnProps {
  navigation: NavigationProp<'createWalletAccountSetup'>
  route: RouteProp<'createWalletAccountSetup'>
}

interface StateProps {
  handleAvailableStatus: HandleAvailableStatus
  isCheckingHandleAvailability: boolean
  currencyConfigs: { [key: string]: EdgeCurrencyConfig }
}

interface DispatchProps {
  checkHandleAvailability: (handle: string) => void
}

type Props = OwnProps & DispatchProps & StateProps
interface State {
  accountHandle: string
}

export class CreateWalletAccountSetup extends React.Component<Props, State> {
  debouncedCheckHandleAvailability: () => void

  constructor(props: Props) {
    super(props)
    const { route } = props
    const { accountHandle = '' } = route.params
    this.state = { accountHandle }
    if (this.state.accountHandle !== '') {
      props.checkHandleAvailability(this.state.accountHandle)
    }
    this.debouncedCheckHandleAvailability = debounce(this.checkHandleAvailability, 400, false)
  }

  componentDidMount() {
    logEvent('Activate_Wallet_Start')
  }

  handleChangeHandle = (accountHandle: string) => {
    this.setState({ accountHandle })
    this.debouncedCheckHandleAvailability()
  }

  checkHandleAvailability = () => {
    const { accountHandle } = this.state
    this.props.checkHandleAvailability(accountHandle)
  }

  onSetup = () => {
    const { handleAvailableStatus, navigation, route } = this.props
    if (handleAvailableStatus === 'AVAILABLE') {
      const { selectedFiat, selectedWalletType, existingWalletId = '' } = route.params
      navigation.navigate('createWalletAccountSelect', {
        selectedFiat,
        selectedWalletType,
        accountName: this.state.accountHandle,
        existingWalletId
      })
    }
  }

  renderButton = () => {
    const { isCheckingHandleAvailability, handleAvailableStatus } = this.props
    return (
      <View style={styles.buttons}>
        <PrimaryButton style={styles.next} onPress={this.onSetup} disabled={isCheckingHandleAvailability || handleAvailableStatus !== 'AVAILABLE'}>
          <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      </View>
    )
  }

  render() {
    const { isCheckingHandleAvailability, handleAvailableStatus, currencyConfigs, route } = this.props
    const { accountHandle } = this.state

    const { selectedWalletType } = route.params
    const { currencyCode } = selectedWalletType
    const walletTypeValue = selectedWalletType.walletType.replace('wallet:', '')
    const isHandleAvailable: boolean = handleAvailableStatus === 'AVAILABLE'
    const validityIcon = isHandleAvailable ? validIcon : invalidIcon

    let chooseHandleErrorMessage = ''
    if (handleAvailableStatus === 'INVALID') {
      chooseHandleErrorMessage = s.strings.create_wallet_account_invalid_account_name
    } else if (handleAvailableStatus === 'UNAVAILABLE') {
      chooseHandleErrorMessage = s.strings.create_wallet_account_account_name_unavailable
    } else if (handleAvailableStatus === 'UNKNOWN_ERROR') {
      chooseHandleErrorMessage = s.strings.create_wallet_account_unknown_error
    }

    const showButton = !!accountHandle && isHandleAvailable && !isCheckingHandleAvailability
    return (
      <SceneWrapper>
        <ScrollView>
          <View style={styles.scrollableView}>
            <CryptoIcon currencyCode={currencyCode} marginRem={[1.5, 0, 0, 0]} pluginId={currencyConfigs[walletTypeValue].currencyInfo.pluginId} sizeRem={4} />
            <View style={[styles.createWalletPromptArea, { paddingTop: 24, paddingBottom: 8 }]}>
              <Text style={styles.instructionalText}>{sprintf(s.strings.create_wallet_account_review_instructions, currencyCode)}</Text>
            </View>
            <View style={[styles.createWalletPromptArea, { paddingTop: 8, paddingBottom: 8 }]}>
              <Text style={styles.handleRequirementsText}>{s.strings.create_wallet_account_requirements_eos}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <FormField
                {...MaterialInputOnWhite}
                containerStyle={{
                  ...MaterialInputOnWhite.containerStyle,
                  marginTop: scale(16),
                  marginBottom: scale(24),
                  width: deviceWidth - scale(25) - scale(40) // substract padding and validation icon
                }}
                autoFocus
                autoCorrect={false}
                onChangeText={this.handleChangeHandle}
                label={s.strings.create_wallet_account_handle}
                value={this.state.accountHandle}
                returnKeyType="next"
                onSubmitEditing={this.onSetup}
                error={chooseHandleErrorMessage}
              />
              <View style={{ width: scale(25), height: scale(25) }}>
                {isCheckingHandleAvailability ? (
                  <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={styles.feedbackIcon} />
                ) : (
                  <Image source={validityIcon} style={styles.feedbackIcon} />
                )}
              </View>
            </View>
            {showButton && this.renderButton()}
            <View style={{ paddingBottom: 400 }} />
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const styles = StyleSheet.create({
  scrollableView: {
    position: 'relative',
    paddingHorizontal: 20
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
  handleRequirementsText: {
    fontSize: scale(16),
    textAlign: 'left',
    color: THEME.COLORS.GRAY_1
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  },
  feedbackIcon: {
    alignSelf: 'flex-end',
    marginTop: scale(43),
    width: scale(25),
    height: scale(25)
  }
})

export const CreateWalletAccountSetupScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isCheckingHandleAvailability: state.ui.scenes.createWallet.isCheckingHandleAvailability,
    handleAvailableStatus: state.ui.scenes.createWallet.handleAvailableStatus,
    currencyConfigs: state.core.account.currencyConfig
  }),
  (dispatch, { route: { params } }) => ({
    checkHandleAvailability(handle: string) {
      dispatch(checkHandleAvailability(params.selectedWalletType.walletType, handle))
    }
  })
)(CreateWalletAccountSetup)
