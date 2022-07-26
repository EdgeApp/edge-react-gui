// @flow
import * as React from 'react'
import { View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { ScrollView } from 'react-native-gesture-handler'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../../hooks/useHandler'
import s from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useState } from '../../../types/reactHooks'
import { type NavigationProp } from '../../../types/routerTypes'
import { type Theme } from '../../../types/Theme'
import { SceneWrapper } from '../../common/SceneWrapper'
import { ConfirmContinueModal } from '../../modals/ConfirmContinueModal'
import { StepProgressBar } from '../../progress-indicators/StepProgressBar'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanStatus'>
}

export const LoanStatusScene = () => {
  // const { navigation } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  // #region Temp hard-coded vars

  const hardCollateral = 'BTC'
  const hardWCollateral = 'WBTC'
  const hardLoanAsset = 'USDC'
  const hardDepositPartner = 'Wyre'

  const [hardDisplayInfos, setHardDisplayInfos] = useState([
    {
      title: sprintf(s.strings.loan_status_step_title_0, hardCollateral, hardWCollateral),
      message: sprintf(s.strings.loan_status_step_body_0, hardCollateral, config.appName, hardWCollateral, s.strings.loan_aave),
      status: 'active'
    },
    {
      title: sprintf(s.strings.loan_status_step_title_1, hardWCollateral),
      message: sprintf(s.strings.loan_status_step_body_1, hardWCollateral, s.strings.loan_aave),
      status: 'pending'
    },
    {
      title: s.strings.loan_status_step_title_2,
      message: sprintf(s.strings.loan_status_step_body_2, hardLoanAsset),
      status: 'pending'
    },
    {
      title: s.strings.loan_status_step_title_3,
      message: sprintf(s.strings.loan_status_step_body_3, hardLoanAsset, hardDepositPartner),
      status: 'pending'
    }
  ])
  const hardInfosLen = hardDisplayInfos.length
  const isComplete = hardDisplayInfos[hardInfosLen - 1].status === 'done'

  // #endregion Temp hard-coded vars

  // Show a confirmation modal before aborting the ActionQueue
  const handleCancelPress = useHandler(async () => {
    const approve = await Airship.show(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        title={s.strings.loan_status_cancel_txs}
        body={sprintf(s.strings.loan_status_cancel_txs_modal_msg, config.appName)}
        isSkippable
      />
    ))

    if (approve) {
      // TODO: Abort action queue
      // navigation.pop()
    }
  })

  const handlePendingPress = useHandler(async () => {
    hardDisplayInfos[0].status = 'active'
    hardDisplayInfos[1].status = 'pending'
    setHardDisplayInfos([...hardDisplayInfos])
  })
  const handleActivePress = useHandler(async () => {
    hardDisplayInfos[0].status = 'complete'
    hardDisplayInfos[1].status = 'active'
    setHardDisplayInfos([...hardDisplayInfos])
  })

  return (
    <SceneWrapper background="theme" hasHeader hasTabs={false}>
      <SceneHeader underline title={s.strings.loan_status_title} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <StepProgressBar actionDisplayInfos={hardDisplayInfos} />
      </ScrollView>
      {/* {isComplete ? (
        <>
          <ConfettiCannon count={250} origin={{ x: -50, y: -50 }} fallSpeed={4000} />
          <View style={styles.footerContainer}>
            <EdgeText style={styles.textCompleteTitle}>{s.strings.exchange_congratulations}</EdgeText>
            <EdgeText style={styles.textCompleteInfo}>{s.strings.loan_status_complete}</EdgeText>
          </View>
        </>
      ) : (
        )} */}
      <MainButton label="active" type="secondary" onPress={handleActivePress} marginRem={[0.5, 1, 2, 1]} />
      <MainButton label="pending" type="secondary" onPress={handlePendingPress} marginRem={[0.5, 1, 2, 1]} />
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    button: {
      color: theme.textLink,
      fontFamily: theme.addButtonFont,
      alignSelf: 'center'
    },
    footerContainer: {
      backgroundColor: theme.tileBackground,
      flexDirection: 'column',
      height: theme.rem(6),
      marginBottom: theme.rem(1)
    },
    textCompleteTitle: {
      width: '100%',
      textAlign: 'center',
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(1.25),
      marginBottom: theme.rem(0.25)
    },
    textCompleteInfo: {
      textAlign: 'center',
      fontSize: theme.rem(0.75)
    },
    scroll: {
      flex: 1,
      marginTop: theme.rem(-0.5)
    },
    scrollContainer: {
      padding: theme.rem(1.5)
    }
  }
})
