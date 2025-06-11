import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

import {
  ACCOUNT_UPGRADE_DAYS_THRESHOLD,
  DEPOSIT_AMOUNT_THRESHOLD,
  FIAT_PURCHASE_COUNT_THRESHOLD,
  markAccountUpgraded,
  readReviewTriggerData,
  SWAP_COUNT_THRESHOLD,
  trackAppUsageAfterUpgrade,
  TRANSACTION_COUNT_THRESHOLD,
  updateDepositAmount,
  updateFiatPurchaseCount,
  updateTransactionCount
} from '../../actions/RequestReviewActions'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { RootState } from '../../types/reduxTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
import { ReviewTriggerData } from '../../types/types'
import { EdgeButton } from '../buttons/EdgeButton'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { SectionHeader } from '../common/SectionHeader'
import { DateModal } from '../modals/DateModal'
import { Airship, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

interface Props extends EdgeSceneProps<'reviewTriggerTest'> {}

export const ReviewTriggerTestScene = (props: Props) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  // Get current account from Redux state
  const account = useSelector((state: RootState) => state.core.account)

  // State for review trigger data
  const [reviewData, setReviewData] = useState<ReviewTriggerData | null>(null)
  const [depositAmount, setDepositAmount] = useState('0')

  // Function to refresh review trigger data
  const refreshReviewData = React.useCallback(async () => {
    try {
      const data = await readReviewTriggerData(account)
      setReviewData(data)
    } catch (error) {
      console.error('Error reading review trigger data:', error)
      showToast('Error reading review trigger data')
    }
  }, [account])

  // Load initial data
  React.useEffect(() => {
    refreshReviewData().catch(error => console.error(error))
  }, [refreshReviewData])

  // Handler for updating deposit amount
  const handleUpdateDepositAmount = React.useCallback(async () => {
    try {
      const amountNum = parseFloat(depositAmount)
      if (isNaN(amountNum)) {
        showToast('Please enter a valid number')
        return
      }

      await dispatch(updateDepositAmount(amountNum))
      showToast(`Updated deposit amount by $${amountNum}`)
      await refreshReviewData()
    } catch (error) {
      console.error('Error updating deposit amount:', error)
      showToast('Error updating deposit amount')
    }
  }, [depositAmount, dispatch, refreshReviewData])

  // Handler for updating transaction count
  const handleUpdateTransactionCount = React.useCallback(async () => {
    try {
      await dispatch(updateTransactionCount())
      showToast('Updated transaction count')
      await refreshReviewData()
    } catch (error) {
      console.error('Error updating transaction count:', error)
      showToast('Error updating transaction count')
    }
  }, [dispatch, refreshReviewData])

  // Handler for updating fiat purchase count
  const handleUpdateFiatPurchaseCount = React.useCallback(async () => {
    try {
      await dispatch(updateFiatPurchaseCount())
      showToast('Updated fiat purchase count')
      await refreshReviewData()
    } catch (error) {
      console.error('Error updating fiat purchase count:', error)
      showToast('Error updating fiat purchase count')
    }
  }, [dispatch, refreshReviewData])

  // Handler for marking account as upgraded
  const handleMarkAccountUpgraded = React.useCallback(async () => {
    try {
      await dispatch(markAccountUpgraded())
      showToast('Marked account as upgraded')
      await refreshReviewData()
    } catch (error) {
      console.error('Error marking account as upgraded:', error)
      showToast('Error marking account as upgraded')
    }
  }, [dispatch, refreshReviewData])

  // Handler for tracking app usage after upgrade
  const handleTrackAppUsageAfterUpgrade = React.useCallback(async () => {
    try {
      await dispatch(trackAppUsageAfterUpgrade())
      showToast('Tracked app usage after upgrade')
      await refreshReviewData()
    } catch (error) {
      console.error('Error tracking app usage after upgrade:', error)
      showToast('Error tracking app usage after upgrade')
    }
  }, [dispatch, refreshReviewData])

  // Handler for setting next trigger date
  const handleSetNextTriggerDate = React.useCallback(async () => {
    const date = await Airship.show<Date | undefined>(bridge => (
      <DateModal bridge={bridge} initialValue={reviewData?.nextTriggerDate != null ? new Date(reviewData.nextTriggerDate) : new Date()} />
    ))
    if (date != null) {
      try {
        // Save the date directly to the review trigger data
        // In a real app, we would use a function to properly update this
        const updatedData = { ...reviewData, nextTriggerDate: date.toISOString() }

        // We're directly manipulating the data rather than using an action for demonstration
        const settings = await account.localDisklet
          .getText('LocalSettings.json')
          .then(text => JSON.parse(text))
          .catch(() => ({}))

        settings.reviewTrigger = updatedData
        await account.localDisklet.setText('LocalSettings.json', JSON.stringify(settings))

        showToast('Set next trigger date')
        await refreshReviewData()
      } catch (error) {
        console.error('Error setting next trigger date:', error)
        showToast('Error setting next trigger date')
      }
    }
  }, [account, refreshReviewData, reviewData])

  return (
    <SceneWrapper>
      <ScrollView>
        {/* Current status section */}
        <EdgeCard>
          {reviewData != null ? (
            <>
              <EdgeText style={styles.statusText}>
                Swap Count: {reviewData.swapCount} / {SWAP_COUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Deposit Amount: ${reviewData.depositAmountUsd.toFixed(2)} / ${DEPOSIT_AMOUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Transaction Count: {reviewData.transactionCount} / {TRANSACTION_COUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Fiat Purchase Count: {reviewData.fiatPurchaseCount} / {FIAT_PURCHASE_COUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>Account Upgraded: {reviewData.accountUpgraded ? 'Yes' : 'No'}</EdgeText>
              <EdgeText style={styles.statusText}>
                Days Since Upgrade: {reviewData.daysSinceUpgrade.length} / {ACCOUNT_UPGRADE_DAYS_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Next Trigger Date: {reviewData.nextTriggerDate != null ? new Date(reviewData.nextTriggerDate).toISOString() : 'Not set'}
              </EdgeText>
            </>
          ) : (
            <EdgeText style={styles.statusText}>Loading review trigger data...</EdgeText>
          )}
        </EdgeCard>

        {/* Update deposit amount section */}
        <SectionHeader leftTitle="Update Deposit Amount" />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter deposit amount (USD)"
            keyboardType="numeric"
            value={depositAmount}
            onChangeText={setDepositAmount}
          />
          <EdgeButton label="Update" onPress={handleUpdateDepositAmount} />
        </View>

        {/* Transaction count section */}
        <SectionHeader leftTitle="Update Transaction Count" />
        <EdgeButton label="Increment Transaction Count" onPress={handleUpdateTransactionCount} />

        {/* Fiat purchase count section */}
        <SectionHeader leftTitle="Update Fiat Purchase Count" />
        <EdgeButton label="Increment Fiat Purchase Count" onPress={handleUpdateFiatPurchaseCount} />

        {/* Account upgrade section */}
        <SectionHeader leftTitle="Account Upgrade Actions" />
        <EdgeButton label="Mark Account Upgraded" onPress={handleMarkAccountUpgraded} />
        <EdgeButton label="Track App Usage After Upgrade" onPress={handleTrackAppUsageAfterUpgrade} />

        {/* Next trigger date section */}
        <SectionHeader leftTitle="Next Trigger Date" />
        <EdgeButton label="Set Next Trigger Date" onPress={handleSetNextTriggerDate} />

        {/* Refresh section */}
        <EdgeButton label="Refresh Data" onPress={refreshReviewData} />
      </ScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: theme.rem(0.5)
  },
  input: {
    flex: 1,
    height: theme.rem(2.5),
    borderWidth: 1,
    borderColor: theme.lineDivider,
    borderRadius: theme.rem(0.25),
    paddingHorizontal: theme.rem(0.5),
    marginRight: theme.rem(0.5),
    color: theme.primaryText
  },
  statusText: {
    marginVertical: theme.rem(0.25)
  }
}))
