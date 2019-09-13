// @flow

import React from 'react'
import { Linking, Platform } from 'react-native'
import { sprintf } from 'sprintf-js'

import { TwoButtonSimpleConfirmationModal } from '../components/modals/TwoButtonSimpleConfirmationModal.js'
import { Airship } from '../components/services/AirshipInstance.js'
import s from '../locales/strings.js'
import * as CORE_SELECTORS from '../modules/Core/selectors.js'
import type { State } from '../types/reduxTypes.js'

const SWAP_COUNT_DATA_FILE = 'swapCountData.json'
const MANY_SWAPS_TO_TRIGGER_REQUEST = 3

const requestReview = async () => {
  const title = sprintf(s.strings.request_review_question_title, s.strings.app_name_short)
  const doRequest = await Airship.show(bridge => (
    <TwoButtonSimpleConfirmationModal
      bridge={bridge}
      title={title}
      subTitle={s.strings.request_review_question_subtitle}
      cancelText={s.strings.request_review_answer_no}
      doneText={s.strings.request_review_answer_yes}
    />
  ))
  if (doRequest) {
    Linking.openURL(Platform.OS === 'ios' ? s.strings.request_review_ios_page_link : s.strings.request_review_android_page_link)
  }
}

export const updateSwapCount = async (state: State) => {
  const account = CORE_SELECTORS.getAccount(state)
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
