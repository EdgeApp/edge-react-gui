import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import ConfettiCannon from 'react-native-confetti-cannon'
import { ScrollView } from 'react-native-gesture-handler'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { AAVE_SUPPORT_ARTICLE_URL_1S } from '../../../constants/aaveConstants'
import { getActionProgramDisplayInfo } from '../../../controllers/action-queue/display'
import { cancelActionProgram } from '../../../controllers/action-queue/redux/actions'
import { ActionDisplayInfo, ActionQueueMap } from '../../../controllers/action-queue/types'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useHandler } from '../../../hooks/useHandler'
import { useUrlHandler } from '../../../hooks/useUrlHandler'
import { lstrings } from '../../../locales/strings'
import { config } from '../../../theme/appConfig'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { Theme } from '../../../types/Theme'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withLoanAccount } from '../../hoc/withLoanAccount'
import { ConfirmContinueModal } from '../../modals/ConfirmContinueModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
import { StepProgressBar } from '../../progress-indicators/StepProgressBar'
import { Airship } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'

interface Props extends EdgeSceneProps<'loanStatus'> {
  loanAccount: LoanAccount
}

export const LoanStatusSceneComponent = (props: Props) => {
  const { navigation, route, loanAccount } = props
  const loanAccountId = loanAccount.id
  const { actionQueueId } = route.params
  const theme = useTheme()
  const styles = getStyles(theme)
  const account: EdgeAccount = useSelector(state => state.core.account)
  const dispatch = useDispatch()

  const buttonMargin = [2, 1, 2, 1]

  const actionQueueMap: ActionQueueMap = useSelector(state => state.actionQueue.actionQueueMap)
  const [displayInfo] = useAsyncValue<ActionDisplayInfo>(async () => {
    const actionQueueItem = actionQueueMap[actionQueueId]

    // 2. The first step of a seq does not get set to 'active'
    const { program, state } = actionQueueItem
    const displayInfo = await getActionProgramDisplayInfo(account, program, state)

    if (displayInfo != null && displayInfo.status instanceof Error) return displayInfo

    return displayInfo
  }, [actionQueueMap])

  // All values derived from displayInfo while it's null are hidden by FillLoader
  const steps = displayInfo != null ? displayInfo.steps : []
  const completeMessage = displayInfo != null ? displayInfo.completeMessage : undefined
  const { title: completeTitle, message: completeBody } = completeMessage ?? { title: '', message: '' }
  // Show a confirmation modal before aborting the ActionQueue
  const handleCancelPress = useHandler(async () => {
    const approve = await Airship.show<boolean>(bridge => (
      <ConfirmContinueModal
        bridge={bridge}
        title={lstrings.loan_status_cancel_txs}
        body={sprintf(lstrings.loan_status_cancel_txs_modal_msg, config.appName)}
        isSkippable
      />
    ))

    if (approve) {
      await dispatch(cancelActionProgram(actionQueueId))
      navigation.pop()
    }
  })

  //
  // Handlers
  //

  const handleInfoIconPress = useUrlHandler(sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'loan-status'))

  const handleDonePress = useHandler(() => {
    if (loanAccountId != null) navigation.navigate('loanDetails', { loanAccountId })
    else navigation.navigate('loanDashboard', {})
  })

  const isProgramDone = steps.length > 0 && steps[steps.length - 1].status === 'done'

  return (
    <SceneWrapper background="theme" hasHeader hasTabs={false}>
      <SceneHeader
        tertiary={
          <TouchableOpacity onPress={handleInfoIconPress}>
            <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
          </TouchableOpacity>
        }
        title={lstrings.loan_status_title}
        underline
        withTopMargin
      />
      {displayInfo == null ? (
        <FillLoader />
      ) : (
        <View style={styles.container}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
            <StepProgressBar actionDisplayInfos={steps} />
          </ScrollView>
          <View style={styles.footerContainer}>
            {isProgramDone ? (
              <>
                <EdgeText style={styles.textCompleteTitle}>{completeTitle}</EdgeText>
                <EdgeText style={styles.textCompleteInfo}>{completeBody}</EdgeText>
              </>
            ) : null}
          </View>
          {isProgramDone ? (
            <MainButton label={lstrings.string_done_cap} type="secondary" onPress={handleDonePress} marginRem={buttonMargin} />
          ) : (
            <MainButton label={lstrings.loan_status_cancel_txs} type="secondary" onPress={handleCancelPress} marginRem={buttonMargin} />
          )}
          {isProgramDone ? <ConfettiCannon count={250} origin={{ x: -50, y: -50 }} fallSpeed={4000} /> : null}
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    container: {
      flex: 1,
      paddingTop: theme.rem(0.5)
    },
    button: {
      color: theme.textLink,
      fontFamily: theme.addButtonFont,
      alignSelf: 'center'
    },
    footerContainer: {
      backgroundColor: theme.tileBackground,
      flexDirection: 'column'
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

export const LoanStatusScene = withLoanAccount(LoanStatusSceneComponent)
