import * as React from 'react'
import { ScrollView, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

import {
  readLocalAccountSettings,
  writeLocalAccountSettings
} from '../../actions/LocalSettingsActions'
import {
  ACCOUNT_UPGRADE_DAYS_THRESHOLD,
  DEPOSIT_AMOUNT_THRESHOLD,
  FIAT_PURCHASE_COUNT_THRESHOLD,
  markAccountUpgraded,
  requestReview,
  SWAP_COUNT_THRESHOLD,
  trackAppUsageAfterUpgrade,
  TRANSACTION_COUNT_THRESHOLD,
  updateDepositAmount,
  updateFiatPurchaseCount,
  updateTransactionCount
} from '../../actions/RequestReviewActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { RootState } from '../../types/reduxTypes'
import { EdgeSceneProps } from '../../types/routerTypes'
import { asReviewTriggerData, ReviewTriggerData } from '../../types/types'
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

  const [reviewData, setReviewData] = useState<ReviewTriggerData | undefined>(
    undefined
  )

  const [depositAmount, setDepositAmount] = useState('0')

  // Function to refresh review trigger data
  const refreshReviewData = useHandler(async () => {
    try {
      const settings = await readLocalAccountSettings(account)
      setReviewData(settings.reviewTrigger)
    } catch (error) {
      console.log('Error reading review trigger data:', JSON.stringify(error))
      showToast('Error reading review trigger data')
    }
  })

  useAsyncEffect(
    async () => {
      await refreshReviewData()
    },
    [],
    'ReviewTriggerTestScene'
  )

  const handleRequestReview = useHandler(async () => {
    try {
      await requestReview()
    } catch (error) {
      console.log('Error requesting review:', JSON.stringify(error))
      showToast('Error requesting review')
    }
  })

  // Handler for updating deposit amount
  const handleUpdateDepositAmount = useHandler(async () => {
    try {
      const amount = parseFloat(depositAmount)
      if (isNaN(amount)) {
        showToast('Please enter a valid number')
        return
      }
      await dispatch(updateDepositAmount(amount))
      showToast(`Updated deposit amount: $${amount}`)
      await refreshReviewData()
    } catch (error) {
      console.log('Error updating deposit amount:', JSON.stringify(error))
      showToast('Error updating deposit amount')
    }
  })

  // Handler for updating transaction count
  const handleUpdateTransactionCount = useHandler(async () => {
    try {
      await dispatch(updateTransactionCount())
      showToast('Updated transaction count')
      await refreshReviewData()
    } catch (error) {
      console.log('Error updating transaction count:', JSON.stringify(error))
      showToast('Error updating transaction count')
    }
  })

  // Handler for updating fiat purchase count
  const handleUpdateFiatPurchaseCount = useHandler(async () => {
    try {
      await dispatch(updateFiatPurchaseCount())
      showToast('Updated fiat purchase count')
      await refreshReviewData()
    } catch (error) {
      console.log('Error updating fiat purchase count:', JSON.stringify(error))
      showToast('Error updating fiat purchase count')
    }
  })

  // Handler for marking account as upgraded
  const handleMarkAccountUpgraded = useHandler(async () => {
    try {
      await dispatch(markAccountUpgraded())
      showToast('Marked account as upgraded')
      await refreshReviewData()
    } catch (error) {
      console.log('Error marking account as upgraded:', JSON.stringify(error))
      showToast('Error marking account as upgraded')
    }
  })

  // Handler for tracking app usage after upgrade
  const handleTrackAppUsageAfterUpgrade = useHandler(async () => {
    try {
      const newDate = await Airship.show<Date | undefined>(bridge => (
        <DateModal bridge={bridge} initialValue={new Date()} />
      ))
      await dispatch(trackAppUsageAfterUpgrade(newDate))
      showToast('Tracked app usage after upgrade')
      await refreshReviewData()
    } catch (error) {
      console.log(
        'Error tracking app usage after upgrade:',
        JSON.stringify(error)
      )
      showToast('Error tracking app usage after upgrade')
    }
  })

  // Handler to reset all review trigger data
  const handleResetReviewData = useHandler(async () => {
    try {
      // Get the current account settings
      const settings = await readLocalAccountSettings(account)

      // Remove review trigger data if it exists
      if (settings.reviewTrigger != null) {
        await writeLocalAccountSettings(account, {
          ...settings,
          reviewTrigger: asReviewTriggerData({})
        })
        showToast('Reset review trigger data')
        await refreshReviewData()
      } else {
        showToast('No review trigger data to reset')
      }
    } catch (error) {
      console.log('Error resetting review trigger data:', JSON.stringify(error))
      showToast('Error resetting review trigger data')
    }
  })

  // Handler for setting next trigger date
  const handleSetNextTriggerDate = useHandler(async () => {
    const date = await Airship.show<Date | undefined>(bridge => (
      <DateModal
        bridge={bridge}
        initialValue={
          reviewData?.nextTriggerDate != null
            ? new Date(reviewData.nextTriggerDate)
            : new Date()
        }
      />
    ))
    if (date != null) {
      try {
        // Save the date directly to the review trigger data
        // In a real app, we would use a function to properly update this

        // We're directly manipulating the data rather than using an action for demonstration
        const settings = await readLocalAccountSettings(account)
        if (settings.reviewTrigger == null) {
          showToast('No review trigger data found')
          return
        }

        settings.reviewTrigger.nextTriggerDate = date

        await writeLocalAccountSettings(account, settings)

        showToast('Set next trigger date')
        await refreshReviewData()
      } catch (error) {
        console.log('Error setting next trigger date:', JSON.stringify(error))
        showToast('Error setting next trigger date')
      }
    }
  })

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
                Deposit Amount: ${reviewData.depositAmountUsd.toFixed(2)} / $
                {DEPOSIT_AMOUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Transaction Count: {reviewData.transactionCount} /{' '}
                {TRANSACTION_COUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Fiat Purchase Count: {reviewData.fiatPurchaseCount} /{' '}
                {FIAT_PURCHASE_COUNT_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Account Upgraded: {reviewData.accountUpgraded ? 'Yes' : 'No'}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Days Since Upgrade: {reviewData.daysSinceUpgrade.length} /{' '}
                {ACCOUNT_UPGRADE_DAYS_THRESHOLD}
              </EdgeText>
              <EdgeText style={styles.statusText}>
                Next Trigger Date:{' '}
                {reviewData.nextTriggerDate != null
                  ? new Date(reviewData.nextTriggerDate).toISOString()
                  : 'Not set'}
              </EdgeText>
            </>
          ) : (
            <EdgeText style={styles.statusText}>
              No review trigger data
            </EdgeText>
          )}
        </EdgeCard>
        <EdgeButton label="Request Review" onPress={handleRequestReview} />

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

        {/* Counts section */}
        <SectionHeader leftTitle="Counts" />
        <EdgeButton
          label="Increment Transaction Count"
          onPress={handleUpdateTransactionCount}
        />
        <EdgeButton
          label="Increment Fiat Purchase Count"
          onPress={handleUpdateFiatPurchaseCount}
        />

        {/* Account upgrade section */}
        <SectionHeader leftTitle="Account Upgrade Actions" />
        <EdgeButton
          label="Mark Account Upgraded"
          onPress={handleMarkAccountUpgraded}
        />
        <EdgeButton
          label="Track App Usage After Upgrade"
          onPress={handleTrackAppUsageAfterUpgrade}
        />

        {/* Next trigger date section */}
        <SectionHeader leftTitle="Next Trigger Date" />
        <EdgeButton
          label="Set Next Trigger Date"
          onPress={handleSetNextTriggerDate}
        />

        {/* Data management section */}
        <SectionHeader leftTitle="Data Management" />
        <EdgeButton label="Refresh Data" onPress={refreshReviewData} />
        <EdgeButton label="Reset All Data" onPress={handleResetReviewData} />
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
