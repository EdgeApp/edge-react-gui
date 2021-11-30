// @flow

import * as React from 'react'
import { Linking, Platform } from 'react-native'
import * as StoreReview from 'react-native-store-review'
import { sprintf } from 'sprintf-js'

import { ButtonsModal } from '../components/modals/ButtonsModal.js'
import { Airship } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import { type RootState } from '../types/reduxTypes.js'

const SWAP_COUNT_DATA_FILE = 'swapCountData.json'
const MANY_SWAPS_TO_TRIGGER_REQUEST = 3

const requestReview = async () => {
  if (Platform.OS === 'ios') {
    StoreReview.requestReview()
  } else if (Platform.OS === 'android') {
    const title = sprintf(s.strings.request_review_question_title, s.strings.app_name_short)
    const result = await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={title}
        message={s.strings.request_review_question_subtitle}
        buttons={{
          ok: { label: s.strings.request_review_answer_yes },
          cancel: { label: s.strings.request_review_answer_no }
        }}
      />
    ))
    if (result === 'ok') {
      Linking.openURL(s.strings.request_review_android_page_link)
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
  } catch (e) {
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
