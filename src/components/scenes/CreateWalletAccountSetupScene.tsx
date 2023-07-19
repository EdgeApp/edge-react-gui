import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { checkHandleAvailability } from '../../actions/CreateWalletActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { lstrings } from '../../locales/strings'
import { HandleAvailableStatus } from '../../reducers/scenes/CreateWalletReducer'
import { connect } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getTokenId } from '../../util/CurrencyInfoHelpers'
import { logEvent } from '../../util/tracking'
import { debounce } from '../../util/utils'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { SceneWrapper } from '../common/SceneWrapper'
import { Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'

interface OwnProps extends EdgeSceneProps<'createWalletAccountSetup'> {}

interface StateProps {
  account: EdgeAccount
  handleAvailableStatus: HandleAvailableStatus
  isCheckingHandleAvailability: boolean
}

interface DispatchProps {
  checkHandleAvailability: (handle: string) => void
}

type Props = OwnProps & DispatchProps & StateProps & ThemeProps
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
    this.debouncedCheckHandleAvailability = debounce(this.checkHandleAvailability, 400, false)
  }

  componentDidMount() {
    logEvent('Activate_Wallet_Start')
  }

  handleChangeHandle = (accountHandle: string) => {
    this.setState({ accountHandle })
    if (accountHandle.length === 12) this.debouncedCheckHandleAvailability()
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

  render() {
    const { account, handleAvailableStatus, isCheckingHandleAvailability, route, theme } = this.props
    const styles = getStyles(theme)
    const { accountHandle } = this.state

    const { selectedWalletType } = route.params
    const { currencyCode } = selectedWalletType
    const walletTypeValue = selectedWalletType.walletType.replace('wallet:', '')
    const isHandleAvailable: boolean = handleAvailableStatus === 'AVAILABLE'

    let chooseHandleErrorMessage
    if (handleAvailableStatus === 'INVALID') {
      chooseHandleErrorMessage = lstrings.create_wallet_account_invalid_account_name
    } else if (handleAvailableStatus === 'UNAVAILABLE') {
      chooseHandleErrorMessage = lstrings.create_wallet_account_account_name_unavailable
    } else if (handleAvailableStatus === 'UNKNOWN_ERROR') {
      chooseHandleErrorMessage = lstrings.create_wallet_account_unknown_error
    } else {
      chooseHandleErrorMessage = undefined
    }

    const handleAvailable = !!accountHandle && isHandleAvailable && !isCheckingHandleAvailability

    const { pluginId } = account.currencyConfig[walletTypeValue].currencyInfo
    const tokenId = getTokenId(account, pluginId, currencyCode)

    return (
      <SceneWrapper padding={theme.rem(0.5)}>
        <View style={styles.container}>
          <View>
            <CryptoIcon marginRem={[1.5, 0, 1, 0.5]} pluginId={pluginId} sizeRem={4} tokenId={tokenId} />
            <View style={styles.createWalletPromptArea}>
              <EdgeText numberOfLines={7}>{sprintf(lstrings.create_wallet_account_review_instructions, currencyCode)}</EdgeText>
            </View>

            <View>
              <OutlinedTextInput
                autoFocus
                autoCorrect={false}
                onChangeText={this.handleChangeHandle}
                label={lstrings.create_wallet_account_handle}
                value={this.state.accountHandle}
                returnKeyType="next"
                onSubmitEditing={this.onSetup}
                error={chooseHandleErrorMessage}
                showSpinner={isCheckingHandleAvailability}
                maxLength={12}
              />
              {/* HACK: Remove this in favor of the "valid" prop after OutlinedTextInput is unified between GUI and login-ui */}
              {handleAvailable ? <EdgeText style={styles.availableText}>{lstrings.create_wallet_account_handle_available}</EdgeText> : null}
            </View>
          </View>

          <ButtonsContainer primary={{ label: lstrings.string_next_capitalized, onPress: this.onSetup, disabled: !handleAvailable }} layout="column" />
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  availableText: {
    color: theme.outlineTextInputLabelColorFocused,
    fontSize: theme.rem(0.75),
    marginTop: theme.rem(-0.35),
    left: theme.rem(1.5)
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  createWalletPromptArea: {
    margin: theme.rem(0.5),
    marginBottom: theme.rem(3)
  }
}))

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
)(withTheme(CreateWalletAccountSetup))
