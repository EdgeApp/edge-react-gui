/* eslint-disable @typescript-eslint/no-unused-vars */
import { RSKRegistrar } from '@rsksmart/rns-sdk'
import { EdgeCurrencyWallet } from 'edge-core-js'
import { ethers } from 'ethers'
import { ErrorFragment } from 'ethers/lib/utils'
import * as React from 'react'
import { ActivityIndicator, Image, Platform, ScrollView } from 'react-native'

import ERC20_ABI from '../../constants/abi/ERC20_ABI.json'
import s from '../../locales/strings'
import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { PLATFORM } from '../../theme/variables/platform'
import { connect } from '../../types/reactRedux'
import { NavigationProp } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { TextInputModal } from '../modals/TextInputModal'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship, showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { FormError } from '../themed/FormError'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { Tile } from '../tiles/Tile'

interface LocalState {
  initLoading: boolean
  prevLoading: boolean
  domainInput?: string
  domainAvailable?: boolean
  domainDurationSelected?: number
  domainPrice: number
  sufficientBalance?: boolean
  errorMessage?: string
  rnsRegistrar?: RSKRegistrar
  paymentWallet?: {
    id: string
    currencyCode: string
  }
}

interface DispatchProps {}

interface StateProps {
  currencyWallets: { [walletId: string]: EdgeCurrencyWallet }
  loading: boolean
  isConnected: boolean
  walletId: string
  currencyCode: string
}

interface OwnProps {
  navigation: NavigationProp<'rnsDomainMinting'>
}

type Props = StateProps & OwnProps & ThemeProps

export class RnsDomainMinting extends React.Component<Props, LocalState> {
  willFocusSubscription: (() => void) | null = null
  state: LocalState = {
    initLoading: true,
    prevLoading: false,
    domainInput: '',
    domainDurationSelected: 1,
    sufficientBalance: false,
    errorMessage: '',
    domainPrice: 0
  }

  static getDerivedStateFromProps(props: Props, state: LocalState): LocalState | null {
    const { loading } = props
    const { prevLoading, initLoading } = state
    if (!loading && prevLoading && initLoading) {
      return {
        prevLoading: loading,
        initLoading: false,
        domainPrice: 0
      }
    }
    if (loading !== prevLoading) {
      return {
        initLoading,
        prevLoading: loading,
        domainPrice: 0
      }
    }

    return null
  }

  onEnterDomainPressed = () => {
    this.openDomainInputFromModal()
    // this.openFioAddressFromModal()
  }

  onEnterDomainDurationPressed = () => {
    this.openDurationInputFromModal()
  }

  openDurationInputFromModal = async () => {
    const { domainDurationSelected } = this.state
    const inputDuration = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        title="Enter domain to register"
        keyboardType="number-pad"
        multiline={false}
        autoFocus
        autoCorrect={false}
        initialValue={domainDurationSelected?.toString()}
      />
    ))

    const inputDurationNumber: number = parseInt(inputDuration ?? '1', 10)
    if (!isNaN(inputDurationNumber)) {
      this.setState({ domainDurationSelected: parseInt(inputDuration ?? '1', 10) })
      this.checkAndUpdatePrice()
    }
  }

  openDomainInputFromModal = async () => {
    const { domainInput } = this.state
    const newdomainInput = await Airship.show<string | undefined>(bridge => (
      <TextInputModal bridge={bridge} title="Enter domain to register" autoCorrect={false} autoCapitalize="none" initialValue={domainInput} />
    ))
    this.setState({ domainInput: newdomainInput ?? domainInput })
    this.checkDomainAvailability()
    this.checkAndUpdatePrice()
  }

  renderSelectWallet = () => {
    const { currencyWallets } = this.props
    // const { activationCost, paymentWallet, loading } = this.state
    const { paymentWallet } = this.state

    const { activationCost, loading } = { activationCost: 1, loading: true }

    const nextDisabled = !activationCost || activationCost === 0 || (!1 && (!paymentWallet || !paymentWallet.id))
    const costStr = loading ? s.strings.loading : `${activationCost} ${'here i am'}`
    const walletName = !paymentWallet || !paymentWallet.id ? s.strings.choose_your_wallet : currencyWallets[paymentWallet.id].name

    return (
      <>
        <Tile type="touchable" title={s.strings.create_wallet_account_select_wallet} body={walletName ?? ''} onPress={this.onWalletPress} />
        {/* {loading && <ActivityIndicator color={theme.iconTappable} />} */}
      </>
    )
  }

  onWalletPress = () => {
    this.selectWallet()
  }

  selectWallet = async () => {
    const { walletId, currencyCode } = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal navigation={this.props.navigation} bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={['RBTC']} />
    ))
    if (walletId && currencyCode) {
      this.setState({
        // signer: new ethers.Wallet(this.props.currencyWallets[walletId ?? 0].displayPrivateSeed ?? '', this.provider),
        paymentWallet: { id: walletId, currencyCode }
      })
      this.initializeRnsRegistrar(walletId)
    }
  }

  initializeRnsRegistrar = (walletId: string): void => {
    const { errorMessage } = this.state
    const signer = new ethers.Wallet(this.props.currencyWallets[walletId ?? 0].displayPrivateSeed ?? '', this.provider)
    const rskRegistrar = new RSKRegistrar(
      '0xca0a477e19bac7e0e172ccfd2e3c28a7200bdb71',
      '0x90734bd6bf96250a7b262e2bc34284b0d47c1e8d',
      '0x19f64674d8a5b4e652319f5e239efd3bc969a1fe',
      signer
    )

    this.setState({ rnsRegistrar: rskRegistrar })

    if (errorMessage !== '') {
      this.checkDomainAvailability()
      this.checkAndUpdatePrice()
    }
  }

  checkWalletBalance = async (): Promise<void> => {
    const { domainPrice, paymentWallet } = this.state
    const walletId = paymentWallet?.id ?? ''
    const estimateGasLimit = 600000

    if (walletId === 'null' || !walletId) {
      console.log('No wallet selected')
    }

    try {
      if (!this.rifContract) {
        const rifContract = new ethers.Contract('0x19f64674d8a5b4e652319f5e239efd3bc969a1fe', ERC20_ABI, this.provider)
        this.rifContract = rifContract
      }
      console.log(this.props.currencyWallets[walletId ?? 0].displayPublicSeed)

      const publicAddress = this.props.currencyWallets[walletId ?? 0].displayPublicSeed?.toLowerCase() ?? ''

      const rifBalance = await this.rifContract.balanceOf(publicAddress)
      const rifBalanceNumber = ethers.utils.formatEther(rifBalance) // RIF has 18 decimals

      const rBtcBalance = await this.provider.getBalance(publicAddress)
      const rBtcBalanceNumber = ethers.utils.formatEther(rBtcBalance) // RBTC has 18 decimals
      const feeData = await this.provider.getGasPrice()
      const estimateGasFee = ethers.utils.formatEther(feeData.mul(estimateGasLimit))

      if (domainPrice > rifBalance) {
        this.setState({ errorMessage: 'Selected wallet do not have enough RIF tokens' })
      } else if (estimateGasFee > rBtcBalanceNumber) {
        this.setState({ errorMessage: 'Selected wallet do not habe enough RBTC for fee' })
      }
    } catch (e) {
      console.log(e)
    }
  }

  commitDomain = async (): Promise<void> => {
    const { domainInput, rnsRegistrar, domainPrice, domainDurationSelected, paymentWallet } = this.state
    const publicAddress = this.props.currencyWallets[paymentWallet?.id ?? 0].displayPublicSeed?.toLowerCase() ?? ''

    try {
      if (rnsRegistrar && domainInput && domainDurationSelected && domainPrice) {
        const { makeCommitmentTransaction, secret, canReveal } = await rnsRegistrar.commitToRegister(domainInput, publicAddress)

        await makeCommitmentTransaction.wait()

        await setTimeout(async () => {
          const commitmentReady = await canReveal()

          if (!commitmentReady) throw Error('error')

          const registerTx = await rnsRegistrar.register(
            domainInput,
            publicAddress,
            secret,
            ethers.BigNumber.from(domainDurationSelected),
            ethers.BigNumber.from(domainPrice)
          )

          const res = await registerTx.wait()
          return res
        }, 120000)
      }
    } catch (e) {
      console.log(e)
    }
  }

  provider = new ethers.providers.JsonRpcProvider('https://public-node.testnet.rsk.co')
  rifContract: undefined | ethers.Contract

  checkDomainAvailability = async () => {
    const { domainInput, rnsRegistrar } = this.state

    if (!rnsRegistrar) {
      this.setState({ errorMessage: 'Please select a wallet' })
      return
    }
    const available = await rnsRegistrar.available(domainInput?.split('.rsk')[0] ?? '')
    this.setState({ domainAvailable: Boolean(available) })

    if (available) {
      this.setState({ errorMessage: '' })
    } else {
      this.setState({ errorMessage: 'Domain not available!', domainPrice: 0 })
    }
  }

  checkAndUpdatePrice = async () => {
    const { domainInput, domainDurationSelected, rnsRegistrar } = this.state
    if (rnsRegistrar && domainInput && domainInput !== '') {
      const durationBN = ethers.BigNumber.from(domainDurationSelected)
      const price = await rnsRegistrar.price(domainInput ?? '', durationBN)
      const priceAmount = ethers.utils.formatEther(price)
      this.setState({ errorMessage: '', domainPrice: parseInt(priceAmount) })
      this.checkWalletBalance()
    }
  }

  render() {
    const { loading, theme } = this.props
    const { initLoading, domainInput, errorMessage, domainAvailable, domainPrice, domainDurationSelected, sufficientBalance } = this.state
    const styles = getStyles(this.props.theme)

    // const noFioDomainsText = `${s.strings.no} ${s.strings.title_fio_domains}`
    // const noFioAddressesText = `${s.strings.no} ${s.strings.title_fio_address}`

    return (
      <>
        <SceneWrapper background="theme">
          <ScrollView style={styles.row}>
            <SceneHeader title="RNS Domains" underline />

            <Fade visible={loading && !initLoading}>
              <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="large" />
            </Fade>
            {this.renderSelectWallet()}
            <Tile type="editable" title="RNS domain" body={domainInput} onPress={this.onEnterDomainPressed}>
              <EdgeText style={styles.loadingText}>{loading ? `(${s.strings.loading})` : ''}</EdgeText>
            </Tile>
            <Tile type="editable" title="Duration (years)" body={domainDurationSelected?.toString()} onPress={this.onEnterDomainDurationPressed} />
            <EdgeText style={styles.priceText} numberOfLines={1}>
              {`Price: ${domainPrice ?? 0} RIF + Fee in RBTC`}
            </EdgeText>
            <FormError style={styles.error} isVisible={errorMessage !== ''}>
              {errorMessage}
            </FormError>
            <MainButton
              label={loading ? '' : 'Register'}
              type="secondary"
              marginRem={[3.5, 0.5]}
              onPress={this.commitDomain}
              alignSelf="center"
              disabled={!domainAvailable || domainInput === '' || !sufficientBalance}
            >
              {loading && <ActivityIndicator color={theme.iconTappable} />}
            </MainButton>
          </ScrollView>
        </SceneWrapper>
        <Fade visible={initLoading} noFadeIn>
          <Gradient style={styles.initLoadingContainer}>
            <ActivityIndicator color={theme.iconTappable} style={styles.loading} size="large" />
          </Gradient>
        </Fade>
      </>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  list: {
    display: 'flex',
    flexDirection: 'column'
  },
  loading: {
    flex: 1,
    marginTop: theme.rem(2.5),
    alignSelf: 'center'
  },
  initLoadingContainer: {
    flex: 1,
    top: 0,
    left: 0,
    position: 'absolute',
    backgroundColor: theme.backgroundGradientColors[1],
    width: '100%',
    height: PLATFORM.deviceHeight
  },
  row: {
    flex: 1
  },
  noNames: {
    color: theme.deactivatedText,
    fontSize: theme.rem(1),
    textAlign: 'center',
    padding: theme.rem(1)
  },
  buttonText: {
    marginLeft: theme.rem(0.5),
    color: theme.textLink,
    textAlign: 'center'
  },
  iconImg: {
    height: theme.rem(2.25),
    marginRight: theme.rem(1.5)
  },
  iconIon: {
    width: theme.rem(1.5),
    marginRight: theme.rem(1),
    textAlign: 'center'
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionIcon: {
    marginTop: theme.rem(0.25)
  },
  priceText: {
    fontSize: theme.rem(0.8),
    textAlign: 'left',
    color: theme.secondaryText,
    marginTop: theme.rem(1),
    marginLeft: theme.rem(1)
  },
  error: {
    flex: 1,
    margin: theme.rem(1)
  },
  bottomContainer: {
    flexDirection: 'row',
    marginRight: theme.rem(1.5),
    minHeight: theme.rem(2)
  },
  valueContainer: {
    flexDirection: 'row',
    marginRight: theme.rem(0.5),
    marginLeft: Platform.OS === 'ios' ? 0 : -3,
    marginTop: Platform.OS === 'ios' ? 0 : -theme.rem(0.75),
    marginBottom: Platform.OS === 'ios' ? 0 : -theme.rem(1)
  },
  bottomAmount: {
    paddingRight: Platform.OS === 'ios' ? 0 : theme.rem(0.25),
    color: theme.primaryText,
    includeFontPadding: false,
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(1.5)
  },
  loadingText: {
    color: theme.deactivatedText
  }
}))

export const RnsDomainMintingScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    loading: state.ui.scenes.fioAddress.fioAddressesLoading,
    isConnected: state.network.isConnected,
    walletId: state.ui.wallets.selectedWalletId,
    currencyWallets: state.core.account.currencyWallets,
    currencyCode: state.ui.wallets.selectedCurrencyCode
  }),
  dispatch => ({})
)(withTheme(RnsDomainMinting))
