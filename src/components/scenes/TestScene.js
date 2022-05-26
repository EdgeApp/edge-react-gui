// @flow

import * as React from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'

import { Gradient } from '../../modules/UI/components/Gradient/Gradient.ui'
import { makeAaveBorrowPlugin, makeAaveDevPlugin, makeAaveKovanBorrowPlugin } from '../../plugins/borrow-plugins'
import { type ApprovableAction, type BorrowEngine } from '../../plugins/borrow-plugins/types'
import { filterActiveBorrowEngines, getAaveBorrowEngines } from '../../plugins/helpers/getAaveBorrowPlugins'
import { useEffect, useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { TextInputModal } from '../modals/TextInputModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, getTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MiniButton } from '../themed/MiniButton'

function usePromise<T>(promise: Promise<T>): [T | void, Error | void] {
  const [result, setResult] = useState<T | void>()
  const [error, setError] = useState<Error | void>()
  useEffect(() => {
    promise.then(setResult).catch(setError)
  }, [promise])
  return [result, error]
}

type Props = {}

const borrowPlugins = {
  production: [makeAaveBorrowPlugin()],
  test: [makeAaveKovanBorrowPlugin()],
  dev: [makeAaveDevPlugin()],
  all: [makeAaveBorrowPlugin(), makeAaveKovanBorrowPlugin(), makeAaveDevPlugin()]
}.dev

const wbtTokenId = 'd1b98b6607330172f1d991521145a22bce793277'
const daiTokenId = 'ff795577d9ac8bd7d90ee22b6c1703490b6512fd'

export function TestScene(props: Props) {
  const theme = getTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)
  const [whenBorrowEngines, setWhenBorrowEngines] = useState(getAaveBorrowEngines(borrowPlugins, account).then(filterActiveBorrowEngines))
  const [borrowEngines, borrowEnginesError] = usePromise(whenBorrowEngines)

  const [approvableAction, setApprovableAction] = useState<{ label: string, action: ApprovableAction } | null>(null)

  const [loading, setLoading] = useState(borrowEngines == null)
  useEffect(() => {
    if (borrowEngines != null || borrowEnginesError != null) {
      setLoading(false)
    }
  }, [borrowEngines, borrowEnginesError])

  const handleGetAprPress = async (engine: BorrowEngine) => {
    const address = await Airship.show(bridge => <TextInputModal bridge={bridge} title="Enter token address" />)
    if (address == null) return

    const tokenId = address.replace('0x', '').toLowerCase()
    const apr = await engine.getAprQuote(tokenId)
    Alert.alert(apr.toString())
  }
  const handleRefreshPress = () => {
    setLoading(true)
    setWhenBorrowEngines(getAaveBorrowEngines(borrowPlugins, account))
  }
  const handleDepositPress = async (engine: BorrowEngine) => {
    const amount = await Airship.show(bridge => <TextInputModal bridge={bridge} title="Enter amount of WBTC" initialValue="100" />)
    if (amount == null) return

    const action = await engine.deposit({ nativeAmount: amount, tokenId: wbtTokenId })
    setApprovableAction({ label: 'Deposit WBTC', action })
  }
  const handleWithdrawPress = async (engine: BorrowEngine) => {
    const amount = await Airship.show(bridge => <TextInputModal bridge={bridge} title="Enter amount of WBTC" initialValue="100" />)
    if (amount == null) return

    const action = await engine.withdraw({ nativeAmount: amount, tokenId: wbtTokenId })
    setApprovableAction({ label: 'Withdraw WBTC', action })
  }
  const handleBorrowPress = async (engine: BorrowEngine) => {
    const amount = await Airship.show(bridge => <TextInputModal bridge={bridge} title="Enter amount DAI" initialValue="10000000000000000" />)
    if (amount == null) return

    const action = await engine.borrow({ nativeAmount: amount, tokenId: daiTokenId })
    setApprovableAction({ label: 'Borrow DAI', action })
  }
  const handleRepayPress = async (engine: BorrowEngine) => {
    const amount = await Airship.show(bridge => <TextInputModal bridge={bridge} title="Enter amount DAI" initialValue="10000000000000000" />)
    if (amount == null) return

    const action = await engine.repay({ nativeAmount: amount, tokenId: daiTokenId })
    setApprovableAction({ label: 'Repay DAI', action })
  }
  const handleClosePress = async (engine: BorrowEngine) => {
    const action = await engine.close()
    setApprovableAction({ label: 'Close account', action })
  }
  const handleApproveAction = async (action: ApprovableAction) => {
    await action.approve()
    setApprovableAction(null)
  }

  const renderHeader = () => {
    return (
      <>
        <ButtonGroup>
          {loading ? <ActivityIndicator color={theme.primaryText} size="small" /> : <MiniButton label="Refresh" onPress={handleRefreshPress} />}
        </ButtonGroup>
        {approvableAction != null ? renderApprovableAction(approvableAction) : null}
      </>
    )
  }

  const renderBorrowEnginesError = (error?: Error) => {
    if (error == null) return null
    return (
      <View style={styles.container}>
        <Text>{error.message}</Text>
      </View>
    )
  }

  const renderApprovableAction = ({ label, action }: { label: string, action: ApprovableAction }) => {
    const feeMsg = `Fee: ${action.networkFee.nativeAmount} ${action.networkFee.currencyCode}`

    return (
      <View style={styles.approveForm}>
        <EdgeText>{label}</EdgeText>
        <EdgeText>{feeMsg}</EdgeText>
        <ButtonGroup>
          <MiniButton label="Send" onPress={() => handleApproveAction(action)} />
          <MiniButton label="Cancel" onPress={() => setApprovableAction(null)} />
        </ButtonGroup>
      </View>
    )
  }

  const renderAccount = (borrowEngine: BorrowEngine) => {
    return (
      <View style={styles.accountContainer}>
        <Text style={styles.accountName}>Account: {borrowEngine.currencyWallet.name}</Text>
        {renderCollaterals(borrowEngine)}
        {renderDebts(borrowEngine)}
        <Box label="LTV">
          <Text>{borrowEngine.loanToValue}</Text>
        </Box>
        <Gradient>
          <ButtonGroup>
            <MiniButton label="Get APR" onPress={() => handleGetAprPress(borrowEngine)} />
            <MiniButton label="Deposit" onPress={() => handleDepositPress(borrowEngine)} />
            <MiniButton label="Withdraw" onPress={() => handleWithdrawPress(borrowEngine)} />
            <MiniButton label="Borrow" onPress={() => handleBorrowPress(borrowEngine)} />
            <MiniButton label="Repay" onPress={() => handleRepayPress(borrowEngine)} />
            <MiniButton label="Close" onPress={() => handleClosePress(borrowEngine)} />
          </ButtonGroup>
        </Gradient>
      </View>
    )
  }

  const renderCollaterals = (engine: BorrowEngine) => {
    const assets = engine.collaterals
    const wallet = engine.currencyWallet
    return (
      <Box label="Collateral">
        {assets.map(asset => {
          const tokenInfo = `${wallet.currencyConfig.allTokens[asset.tokenId ?? '']?.displayName} ${asset.tokenId ?? ''}`
          return (
            <View key={asset.tokenId}>
              <Box label="Token ID">
                <Text>{tokenInfo}</Text>
              </Box>
              <Box label="Amount">
                <Text>{asset.nativeAmount}</Text>
              </Box>
            </View>
          )
        })}
      </Box>
    )
  }
  const renderDebts = (engine: BorrowEngine) => {
    const assets = engine.debts
    const wallet = engine.currencyWallet
    return (
      <Box label="Debt">
        {assets.map(asset => {
          const tokenInfo = `${wallet.currencyConfig.allTokens[asset.tokenId ?? '']?.displayName ?? ''} ${asset.tokenId ?? ''}`
          return (
            <View key={asset.tokenId}>
              <Box label="Token">
                <Text>{tokenInfo}</Text>
              </Box>
              <Box label="Amount">
                <Text>{asset.nativeAmount}</Text>
              </Box>
              <Box label="APR">
                <Text>{asset.apr}</Text>
              </Box>
            </View>
          )
        })}
      </Box>
    )
  }

  return (
    <SceneWrapper>
      {renderHeader()}
      <ScrollView>
        {renderBorrowEnginesError(borrowEnginesError)}
        <View style={styles.container}>{borrowEngines != null ? borrowEngines.map(renderAccount) : null}</View>
      </ScrollView>
    </SceneWrapper>
  )
}

type BoxProps = {
  label: string,
  children?: React.Node
}
const Box = ({ label, children }: BoxProps) => {
  const theme = getTheme()
  const styles = getStyles(theme)
  return (
    <View style={styles.box}>
      <Text style={styles.boxLabel}>{label}</Text>
      {children}
    </View>
  )
}

type ButtonGroupProps = {
  children?: React.Node
}
const ButtonGroup = ({ children }: ButtonGroupProps) => {
  const theme = getTheme()
  const styles = getStyles(theme)
  const items = Array.isArray(children) ? children : [children]
  return (
    <View style={styles.buttonGroup}>
      {items.map((item, i) => (
        <View key={i} style={styles.buttonGroupItem}>
          {item}
        </View>
      ))}
    </View>
  )
}

const getStyles = cacheStyles(theme => {
  const headingBase = {
    fontWeight: 'bold',
    fontSize: theme.rem(1),
    paddingBottom: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  }

  return {
    container: {
      backgroundColor: '#eee'
    },
    heading: {
      ...headingBase,
      color: 'white'
    },
    approveForm: {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: theme.rem(0.25),
      justifyContent: 'center',
      margin: theme.rem(1),
      padding: theme.rem(1),
      paddingBottom: 0
    },
    buttonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-around',
      padding: theme.rem(0.5)
    },
    buttonGroupItem: {
      padding: theme.rem(0.5)
    },
    accountName: {
      ...headingBase
    },
    accountContainer: {
      paddingVertical: theme.rem(1),
      paddingHorizontal: theme.rem(0.5)
    },
    box: {
      borderWidth: 1,
      padding: theme.rem(0.5),
      margin: theme.rem(0.5)
    },
    boxLabel: {
      fontWeight: 'bold',
      position: 'absolute',
      top: theme.rem(-0.5),
      left: theme.rem(0.5),
      paddingHorizontal: theme.rem(0.5),
      backgroundColor: '#eee',
      color: '#666'
    }
  }
})
