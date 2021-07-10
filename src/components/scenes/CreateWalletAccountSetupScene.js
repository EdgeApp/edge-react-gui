// @flow

import { type EdgeCurrencyConfig } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { checkHandleAvailability } from '../../actions/CreateWalletActions.js'
import invalidIcon from '../../assets/images/createWallet/invalid_icon.png'
import validIcon from '../../assets/images/createWallet/valid_icon.png'
import { CREATE_WALLET_ACCOUNT_SELECT } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import type { HandleAvailableStatus } from '../../reducers/scenes/CreateWalletReducer.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import type { CreateWalletType, GuiFiatType } from '../../types/types.js'
import { getCurrencyIcon } from '../../util/CurrencyInfoHelpers.js'
import { scale } from '../../util/scaling.js'
import { logEvent } from '../../util/tracking.js'
import { debounce } from '../../util/utils'
import { FormField, MaterialInputOnWhite } from '../common/FormField.js'

const deviceWidth = PLATFORM.deviceWidth

type OwnProps = {
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  accountHandle?: string,
  isReactivation?: boolean,
  existingWalletId?: string
}

type StateProps = {
  handleAvailableStatus: HandleAvailableStatus,
  isCheckingHandleAvailability: boolean,
  currencyConfigs: { [key: string]: EdgeCurrencyConfig }
}

type DispatchProps = {
  checkHandleAvailability: (handle: string) => void
}

type Props = OwnProps & DispatchProps & StateProps
type State = {
  accountHandle: string
}

class CreateWalletAccountSetup extends React.Component<Props, State> {
  debouncedCheckHandleAvailability: () => void

  constructor(props: Props) {
    super(props)

    this.state = {
      accountHandle: props.accountHandle || ''
    }
    if (this.state.accountHandle) {
      props.checkHandleAvailability(this.state.accountHandle)
    }
    this.debouncedCheckHandleAvailability = debounce(this.checkHandleAvailability, 400, false)
  }

  componentDidMount() {
    logEvent('ActivateWalletStart')
  }

  onBack = () => {
    Actions.pop()
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
    if (this.props.handleAvailableStatus === 'AVAILABLE') {
      Actions[CREATE_WALLET_ACCOUNT_SELECT]({
        ...this.props,
        accountName: this.state.accountHandle
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
    const { isCheckingHandleAvailability, handleAvailableStatus, selectedWalletType, currencyConfigs } = this.props
    const { accountHandle } = this.state
    const { currencyCode } = selectedWalletType
    const walletTypeValue = selectedWalletType.walletType.replace('wallet:', '')
    const { symbolImage } = getCurrencyIcon(currencyConfigs[walletTypeValue].currencyInfo.currencyCode)
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
      <SafeAreaView>
        <Gradient style={styles.scrollableGradient} />
        <ScrollView>
          <View style={styles.scrollableView}>
            <Image source={{ uri: symbolImage }} style={styles.currencyLogo} resizeMode="cover" />
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
      </SafeAreaView>
    )
  }
}

const rawStyles = {
  scrollableGradient: {
    height: THEME.HEADER
  },
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
  currencyLogo: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(64),
    width: scale(64)
  },
  feedbackIcon: {
    alignSelf: 'flex-end',
    marginTop: scale(43),
    width: scale(25),
    height: scale(25)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const CreateWalletAccountSetupScene = connect(
  (state: RootState): StateProps => ({
    isCheckingHandleAvailability: state.ui.scenes.createWallet.isCheckingHandleAvailability,
    handleAvailableStatus: state.ui.scenes.createWallet.handleAvailableStatus,
    currencyConfigs: state.core.account.currencyConfig
  }),
  (dispatch: Dispatch, ownProps: OwnProps): DispatchProps => ({
    checkHandleAvailability(handle: string) {
      dispatch(checkHandleAvailability(ownProps.selectedWalletType.currencyCode, handle))
    }
  })
)(CreateWalletAccountSetup)
