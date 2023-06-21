import * as React from 'react'
import { Linking, Platform } from 'react-native'
import InAppReview from 'react-native-in-app-review'
import * as StoreReview from 'react-native-store-review'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { RootState } from '../types/reduxTypes'

const SWAP_COUNT_DATA_FILE = 'swapCountData.json'
const MANY_SWAPS_TO_TRIGGER_REQUEST = 3

const requestReview = async () => {
  if (Platform.OS === 'ios') {
    StoreReview.requestReview()
  } else if (Platform.OS === 'android') {
    if (InAppReview.isAvailable()) {
      // In-app review with comment support
      await InAppReview.RequestInAppReview()
    } else {
      const title = sprintf(lstrings.request_review_question_title, config.appNameShort)
      const result = await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
        <ButtonsModal
          bridge={bridge}
          title={title}
          message={lstrings.request_review_question_subtitle}
          buttons={{
            ok: { label: lstrings.request_review_answer_yes },
            cancel: { label: lstrings.request_review_answer_no }
          }}
        />
      ))
      if (result === 'ok') {
        await Linking.openURL(lstrings.request_review_android_page_link)
      }
    }
  } else {
    console.warn(`Unhandled Platform.OS: ${Platform.OS}. Unable to request review from user`)
  }
}

export const updateSwapCount = async (state: RootState) => {
  const { account } = state.core
  let swapCountData
  try {
    const swapCountDataStr = await account.disklet.getText(SWAP_COUNT_DATA_FILE)
    swapCountData = JSON.parse(swapCountDataStr)
  } catch (e: any) {
    // File needs init
    swapCountData = {
      swapCount: 0,
      hasReviewBeenRequested: false
    }
  }

  const hasReviewBeenRequested = swapCountData.hasReviewBeenRequested
  if (!hasReviewBeenRequested) {
    let swapCount = parseInt(swapCountData.swapCount)
    swapCount++
    swapCountData.swapCount = swapCount
    if (swapCount >= MANY_SWAPS_TO_TRIGGER_REQUEST) {
      await requestReview()
      swapCountData.hasReviewBeenRequested = true
    }
    const swapCountDataStr = JSON.stringify(swapCountData)
    await account.disklet.setText(SWAP_COUNT_DATA_FILE, swapCountDataStr).catch(e => {
      // Failure to write the swapCount file is tolerable since it just means the user won't be
      //  asked to make a review
      console.log(`RequestReviewActions.updateSwapCount: Error writing file ${SWAP_COUNT_DATA_FILE}:`, e)
    })
  }
}
