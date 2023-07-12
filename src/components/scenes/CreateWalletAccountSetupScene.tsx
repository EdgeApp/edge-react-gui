import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { checkHandleAvailability } from '../../actions/CreateWalletActions'
import invalidIcon from '../../assets/images/createWallet/invalid_icon.png'
import validIcon from '../../assets/images/createWallet/valid_icon.png'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { lstrings } from '../../locales/strings'
import { HandleAvailableStatus } from '../../reducers/scenes/CreateWalletReducer'
import { THEME } from '../../theme/variables/airbitz'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { scale } from '../../util/scaling'
import { logEvent } from '../../util/tracking'
import { debounce } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { FormattedText as Text } from '../legacy/FormattedText/FormattedText.ui'
import { FormField, MaterialInputOnWhite } from '../legacy/FormField'

const deviceWidth = Dimensions.get('window').width

interface OwnProps extends EdgeSceneProps<'createWalletAccountSetup'> {}

interface StateProps {
  account: EdgeAccount
  handleAvailableStatus: HandleAvailableStatus
  isCheckingHandleAvailability: boolean
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
          <PrimaryButton.Text>{lstrings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      </View>
    )
  }

  render() {
    const { account, handleAvailableStatus, isCheckingHandleAvailability, route } = this.props
    const { accountHandle } = this.state

    const { selectedWalletType } = route.params
    const { currencyCode } = selectedWalletType
    const walletTypeValue = selectedWalletType.walletType.replace('wallet:', '')
    const isHandleAvailable: boolean = handleAvailableStatus === 'AVAILABLE'
    const validityIcon = isHandleAvailable ? validIcon : invalidIcon

    let chooseHandleErrorMessage = ''
    if (handleAvailableStatus === 'INVALID') {
      chooseHandleErrorMessage = lstrings.create_wallet_account_invalid_account_name
    } else if (handleAvailableStatus === 'UNAVAILABLE') {
      chooseHandleErrorMessage = lstrings.create_wallet_account_account_name_unavailable
    } else if (handleAvailableStatus === 'UNKNOWN_ERROR') {
      chooseHandleErrorMessage = lstrings.create_wallet_account_unknown_error
    }

    const showButton = !!accountHandle && isHandleAvailable && !isCheckingHandleAvailability

    const { pluginId } = account.currencyConfig[walletTypeValue].currencyInfo
    const tokenId = getTokenId(account, pluginId, currencyCode)

    return (
      <SceneWrapper background="legacy">
        <ScrollView>
          <View style={styles.scrollableView}>
            <CryptoIcon marginRem={[1.5, 0, 0, 0]} pluginId={pluginId} sizeRem={4} tokenId={tokenId} />
            <View style={[styles.createWalletPromptArea, { paddingTop: 24, paddingBottom: 8 }]}>
              <Text style={styles.instructionalText}>{sprintf(lstrings.create_wallet_account_review_instructions, currencyCode)}</Text>
            </View>
            <View style={[styles.createWalletPromptArea, { paddingTop: 8, paddingBottom: 8 }]}>
              <Text style={styles.handleRequirementsText}>{lstrings.create_wallet_account_requirements_eos}</Text>
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
                label={lstrings.create_wallet_account_handle}
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
    account: state.core.account,
    isCheckingHandleAvailability: state.ui.createWallet.isCheckingHandleAvailability,
    handleAvailableStatus: state.ui.createWallet.handleAvailableStatus
  }),
  (dispatch, { route: { params } }) => ({
    checkHandleAvailability(handle: string) {
      dispatch(checkHandleAvailability(params.selectedWalletType.walletType, handle))
    }
  })
)(CreateWalletAccountSetup)
